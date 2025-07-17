#!/bin/bash

# =================================================================
# Nginx 負載均衡管理腳本
# 作者: DevOps Team
# 版本: 1.0.0
# 描述: Nginx 負載均衡和流量切換管理工具
# =================================================================

# Nginx 配置目錄
readonly NGINX_CONFIG_DIR="$PROJECT_ROOT/deployment/nginx"
readonly NGINX_CONF_FILE="$NGINX_CONFIG_DIR/nginx.conf"
readonly NGINX_DEFAULT_CONF="$NGINX_CONFIG_DIR/conf.d/default.conf"
readonly NGINX_UPSTREAM_CONF="$NGINX_CONFIG_DIR/conf.d/upstream.conf"

# 更新 Nginx 配置
update_nginx_config() {
    local target_color="$1"
    
    log_info "Updating Nginx configuration for $target_color deployment..."
    
    # 備份當前配置
    backup_nginx_config
    
    # 更新 upstream 配置
    update_upstream_config "$target_color"
    
    # 驗證配置
    validate_nginx_config
    
    log_success "Nginx configuration updated for $target_color deployment"
}

# 備份 Nginx 配置
backup_nginx_config() {
    local backup_dir="$LOGS_DIR/nginx_backup_${TIMESTAMP}"
    mkdir -p "$backup_dir"
    
    log_info "Backing up Nginx configuration..."
    
    if [[ -f "$NGINX_DEFAULT_CONF" ]]; then
        cp "$NGINX_DEFAULT_CONF" "$backup_dir/default.conf.backup"
        log_success "Nginx configuration backed up to: $backup_dir"
    else
        log_warn "Nginx configuration file not found: $NGINX_DEFAULT_CONF"
    fi
}

# 更新 upstream 配置
update_upstream_config() {
    local target_color="$1"
    local primary_port
    local backup_port
    
    case "$target_color" in
        blue)
            primary_port=3001
            backup_port=3002
            ;;
        green)
            primary_port=3002
            backup_port=3001
            ;;
        *)
            error_exit "Invalid target color: $target_color"
            ;;
    esac
    
    log_info "Updating upstream configuration - Primary: $primary_port, Backup: $backup_port"
    
    # 創建新的 upstream 配置
    cat > "$NGINX_UPSTREAM_CONF" << EOF
upstream newpennine_backend {
    server newpennine-${target_color}:3000 weight=100 max_fails=3 fail_timeout=30s;
    server newpennine-$(get_inactive_color):3000 weight=0 max_fails=3 fail_timeout=30s backup;
}

upstream newpennine_health {
    server newpennine-${target_color}:3000;
}
EOF
    
    # 更新主配置文件
    update_main_nginx_config "$target_color"
    
    log_success "Upstream configuration updated"
}

# 更新主 Nginx 配置
update_main_nginx_config() {
    local target_color="$1"
    
    cat > "$NGINX_DEFAULT_CONF" << EOF
# NewPennine WMS Nginx Configuration
# Active deployment: $target_color
# Updated: $(date)

# Rate limiting zones
limit_req_zone \$binary_remote_addr zone=api:10m rate=10r/s;
limit_req_zone \$binary_remote_addr zone=login:10m rate=5r/s;

# Caching zones
proxy_cache_path /tmp/nginx_cache levels=1:2 keys_zone=main:10m max_size=100m inactive=60m;

server {
    listen 80;
    server_name localhost;
    
    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    
    # Compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;
    
    # Main application
    location / {
        proxy_pass http://newpennine_backend;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        
        # Timeouts
        proxy_connect_timeout 30s;
        proxy_send_timeout 30s;
        proxy_read_timeout 30s;
        
        # Buffering
        proxy_buffering on;
        proxy_buffer_size 4k;
        proxy_buffers 8 4k;
        
        # Health check
        proxy_next_upstream error timeout invalid_header http_500 http_502 http_503 http_504;
        proxy_next_upstream_tries 2;
        
        # Add deployment info
        add_header X-Deployment-Color "$target_color" always;
        add_header X-Deployment-Version "\$DEPLOYMENT_VERSION" always;
    }
    
    # API routes with rate limiting
    location /api/ {
        limit_req zone=api burst=20 nodelay;
        
        proxy_pass http://newpennine_backend;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        
        # API specific timeouts
        proxy_connect_timeout 10s;
        proxy_send_timeout 10s;
        proxy_read_timeout 60s;
        
        # Caching for specific endpoints
        proxy_cache main;
        proxy_cache_valid 200 302 10m;
        proxy_cache_valid 404 1m;
        proxy_cache_key "\$scheme\$request_method\$host\$request_uri";
        
        add_header X-Cache-Status \$upstream_cache_status;
        add_header X-Deployment-Color "$target_color" always;
    }
    
    # Login page with stricter rate limiting
    location /main-login {
        limit_req zone=login burst=10 nodelay;
        
        proxy_pass http://newpennine_backend;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        
        add_header X-Deployment-Color "$target_color" always;
    }
    
    # Health check endpoint
    location /health {
        access_log off;
        proxy_pass http://newpennine_health/api/v1/health;
        proxy_set_header Host \$host;
        proxy_connect_timeout 5s;
        proxy_send_timeout 5s;
        proxy_read_timeout 5s;
        
        add_header X-Deployment-Color "$target_color" always;
    }
    
    # Static files
    location /_next/static/ {
        proxy_pass http://newpennine_backend;
        proxy_cache main;
        proxy_cache_valid 200 1h;
        expires 1h;
        add_header Cache-Control "public, immutable";
        add_header X-Deployment-Color "$target_color" always;
    }
    
    # Error pages
    error_page 500 502 503 504 /50x.html;
    location = /50x.html {
        root /usr/share/nginx/html;
    }
}

# HTTPS configuration (if certificates are available)
server {
    listen 443 ssl http2;
    server_name localhost;
    
    # SSL configuration
    ssl_certificate /etc/nginx/ssl/cert.pem;
    ssl_certificate_key /etc/nginx/ssl/key.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES128-GCM-SHA256:ECDHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    
    # HSTS
    add_header Strict-Transport-Security "max-age=63072000" always;
    
    # Same configuration as HTTP but with SSL
    location / {
        proxy_pass http://newpennine_backend;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto https;
        
        add_header X-Deployment-Color "$target_color" always;
    }
}
EOF
    
    log_success "Main Nginx configuration updated"
}

# 驗證 Nginx 配置
validate_nginx_config() {
    log_info "Validating Nginx configuration..."
    
    # 檢查配置文件語法
    if docker exec newpennine-nginx nginx -t 2>/dev/null; then
        log_success "Nginx configuration validation passed"
    else
        # 如果 Docker 容器不存在，使用本地 nginx 檢查
        if command -v nginx &> /dev/null; then
            if nginx -t -c "$NGINX_CONF_FILE" 2>/dev/null; then
                log_success "Nginx configuration validation passed"
            else
                error_exit "Nginx configuration validation failed"
            fi
        else
            log_warn "Cannot validate Nginx configuration - nginx command not available"
        fi
    fi
}

# 重載 Nginx 配置
reload_nginx() {
    log_info "Reloading Nginx configuration..."
    
    # 檢查 Nginx 容器是否運行
    if docker ps | grep -q "newpennine-nginx"; then
        if docker exec newpennine-nginx nginx -s reload; then
            log_success "Nginx configuration reloaded successfully"
        else
            error_exit "Failed to reload Nginx configuration"
        fi
    else
        # 如果容器不存在，重啟 Nginx 服務
        restart_nginx_service
    fi
}

# 重啟 Nginx 服務
restart_nginx_service() {
    log_info "Restarting Nginx service..."
    
    if docker-compose -f "$PROJECT_ROOT/docker-compose.prod.yml" restart nginx; then
        log_success "Nginx service restarted successfully"
        
        # 等待 Nginx 服務啟動
        wait_for_nginx_startup
    else
        error_exit "Failed to restart Nginx service"
    fi
}

# 等待 Nginx 服務啟動
wait_for_nginx_startup() {
    local timeout=60
    local count=0
    
    log_info "Waiting for Nginx service to start..."
    
    while [[ $count -lt $timeout ]]; do
        if curl -f -s http://localhost:80/health > /dev/null; then
            log_success "Nginx service is ready"
            return 0
        fi
        
        sleep 1
        ((count++))
        
        if [[ $((count % 10)) -eq 0 ]]; then
            log_info "Still waiting for Nginx service... ($count/$timeout)"
        fi
    done
    
    error_exit "Nginx service failed to start within $timeout seconds"
}

# 驗證流量切換
verify_traffic_switch() {
    local target_color="$1"
    
    log_info "Verifying traffic switch to $target_color..."
    
    # 檢查 Nginx 狀態
    if ! curl -f -s http://localhost:80/health > /dev/null; then
        error_exit "Nginx health check failed after traffic switch"
    fi
    
    # 檢查部署顏色標頭
    local deployment_color=$(curl -s -I http://localhost:80/health | grep -i "X-Deployment-Color" | cut -d' ' -f2 | tr -d '\r')
    
    if [[ "$deployment_color" == "$target_color" ]]; then
        log_success "Traffic successfully switched to $target_color"
    else
        error_exit "Traffic switch verification failed - expected: $target_color, got: $deployment_color"
    fi
    
    # 多次請求驗證
    local success_count=0
    local total_requests=10
    
    for ((i=1; i<=total_requests; i++)); do
        local color_header=$(curl -s -I http://localhost:80/health | grep -i "X-Deployment-Color" | cut -d' ' -f2 | tr -d '\r')
        
        if [[ "$color_header" == "$target_color" ]]; then
            ((success_count++))
        fi
    done
    
    if [[ $success_count -eq $total_requests ]]; then
        log_success "Traffic switch verification passed ($success_count/$total_requests)"
    else
        error_exit "Traffic switch verification failed ($success_count/$total_requests)"
    fi
}

# 執行金絲雀部署
perform_canary_deployment() {
    local target_color="$1"
    local canary_percentage="${2:-10}"
    
    log_info "Performing canary deployment to $target_color with $canary_percentage% traffic..."
    
    # 創建金絲雀 upstream 配置
    cat > "$NGINX_UPSTREAM_CONF" << EOF
upstream newpennine_backend {
    server newpennine-$(get_active_color):3000 weight=$((100 - canary_percentage));
    server newpennine-${target_color}:3000 weight=${canary_percentage};
}
EOF
    
    # 驗證並重載配置
    validate_nginx_config
    reload_nginx
    
    log_success "Canary deployment configured with $canary_percentage% traffic to $target_color"
}

# 完成金絲雀部署
complete_canary_deployment() {
    local target_color="$1"
    
    log_info "Completing canary deployment - switching 100% traffic to $target_color..."
    
    # 更新為完整流量切換
    update_nginx_config "$target_color"
    reload_nginx
    
    log_success "Canary deployment completed - 100% traffic switched to $target_color"
}

# 回滾金絲雀部署
rollback_canary_deployment() {
    local original_color="$1"
    
    log_info "Rolling back canary deployment to $original_color..."
    
    # 恢復原始配置
    update_nginx_config "$original_color"
    reload_nginx
    
    log_success "Canary deployment rolled back to $original_color"
}

# 獲取 Nginx 統計信息
get_nginx_stats() {
    log_info "Gathering Nginx statistics..."
    
    # 獲取 Nginx 狀態
    local nginx_status=$(curl -s http://localhost:80/nginx_status 2>/dev/null || echo "Status endpoint not available")
    
    # 獲取當前配置信息
    local current_upstream=$(grep -A 10 "upstream newpennine_backend" "$NGINX_UPSTREAM_CONF" 2>/dev/null || echo "Upstream config not found")
    
    # 獲取訪問日誌統計
    local access_log_stats=""
    if [[ -f "/var/log/nginx/access.log" ]]; then
        access_log_stats=$(tail -100 /var/log/nginx/access.log | awk '{print $9}' | sort | uniq -c | sort -nr)
    fi
    
    log_info "Nginx Statistics:"
    log_info "Current upstream configuration:"
    log_info "$current_upstream"
    log_info "Status: $nginx_status"
    
    if [[ -n "$access_log_stats" ]]; then
        log_info "Recent response codes:"
        log_info "$access_log_stats"
    fi
}

# 檢查 Nginx 健康狀態
check_nginx_health() {
    log_info "Checking Nginx health..."
    
    # 檢查 Nginx 容器狀態
    if ! docker ps | grep -q "newpennine-nginx"; then
        error_exit "Nginx container is not running"
    fi
    
    # 檢查 Nginx 進程
    local nginx_processes=$(docker exec newpennine-nginx ps aux | grep nginx | grep -v grep | wc -l)
    
    if [[ $nginx_processes -lt 1 ]]; then
        error_exit "Nginx processes not found in container"
    fi
    
    # 檢查端口監聽
    if ! docker exec newpennine-nginx netstat -tlnp | grep -q ":80"; then
        error_exit "Nginx is not listening on port 80"
    fi
    
    # 檢查配置文件
    if ! docker exec newpennine-nginx test -f /etc/nginx/nginx.conf; then
        error_exit "Nginx configuration file not found"
    fi
    
    log_success "Nginx health check passed"
}

# 生成 Nginx 配置模板
generate_nginx_config_template() {
    local template_dir="$NGINX_CONFIG_DIR/templates"
    mkdir -p "$template_dir"
    
    log_info "Generating Nginx configuration templates..."
    
    # 主配置模板
    cat > "$template_dir/nginx.conf.template" << 'EOF'
user nginx;
worker_processes auto;
error_log /var/log/nginx/error.log warn;
pid /var/run/nginx.pid;

events {
    worker_connections 1024;
    use epoll;
    multi_accept on;
}

http {
    include /etc/nginx/mime.types;
    default_type application/octet-stream;
    
    # Log format
    log_format main '$remote_addr - $remote_user [$time_local] "$request" '
                    '$status $body_bytes_sent "$http_referer" '
                    '"$http_user_agent" "$http_x_forwarded_for"';
    
    access_log /var/log/nginx/access.log main;
    
    # Basic settings
    sendfile on;
    tcp_nopush on;
    tcp_nodelay on;
    keepalive_timeout 65;
    types_hash_max_size 2048;
    
    # Include configurations
    include /etc/nginx/conf.d/*.conf;
}
EOF
    
    # Upstream 配置模板
    cat > "$template_dir/upstream.conf.template" << 'EOF'
upstream newpennine_backend {
    server newpennine-{{COLOR}}:3000 weight=100 max_fails=3 fail_timeout=30s;
    server newpennine-{{BACKUP_COLOR}}:3000 weight=0 max_fails=3 fail_timeout=30s backup;
}
EOF
    
    log_success "Nginx configuration templates generated"
}

# 應用配置模板
apply_nginx_template() {
    local template_name="$1"
    local target_color="$2"
    local backup_color="$3"
    
    log_info "Applying Nginx template: $template_name"
    
    local template_file="$NGINX_CONFIG_DIR/templates/${template_name}.template"
    local output_file="$NGINX_CONFIG_DIR/conf.d/${template_name}"
    
    if [[ ! -f "$template_file" ]]; then
        error_exit "Template file not found: $template_file"
    fi
    
    # 替換變量
    sed -e "s/{{COLOR}}/$target_color/g" \
        -e "s/{{BACKUP_COLOR}}/$backup_color/g" \
        -e "s/{{TIMESTAMP}}/$(date)/g" \
        "$template_file" > "$output_file"
    
    log_success "Nginx template applied: $output_file"
}

# 監控 Nginx 性能
monitor_nginx_performance() {
    log_info "Monitoring Nginx performance..."
    
    # 收集性能指標
    local connections=$(docker exec newpennine-nginx netstat -an | grep :80 | wc -l)
    local memory_usage=$(docker stats newpennine-nginx --no-stream --format "{{.MemUsage}}" | cut -d'/' -f1)
    local cpu_usage=$(docker stats newpennine-nginx --no-stream --format "{{.CPUPerc}}" | sed 's/%//')
    
    log_info "Nginx Performance Metrics:"
    log_info "  Active connections: $connections"
    log_info "  Memory usage: $memory_usage"
    log_info "  CPU usage: $cpu_usage%"
    
    # 性能警告
    if [[ $connections -gt 500 ]]; then
        log_warn "High connection count: $connections"
    fi
    
    if (( $(echo "$cpu_usage > 80" | bc -l) )); then
        log_warn "High CPU usage: $cpu_usage%"
    fi
}

# 設置 Nginx 監控
setup_nginx_monitoring() {
    log_info "Setting up Nginx monitoring..."
    
    # 啟用 stub_status 模塊
    cat > "$NGINX_CONFIG_DIR/conf.d/status.conf" << 'EOF'
server {
    listen 8080;
    server_name localhost;
    
    location /nginx_status {
        stub_status on;
        access_log off;
        allow 127.0.0.1;
        allow 172.0.0.0/8;
        deny all;
    }
}
EOF
    
    validate_nginx_config
    reload_nginx
    
    log_success "Nginx monitoring setup completed"
}
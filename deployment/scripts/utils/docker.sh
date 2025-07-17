#!/bin/bash

# =================================================================
# Docker 管理工具函數
# 作者: DevOps Team
# 版本: 1.0.0
# 描述: Docker 容器和映像管理工具函數
# =================================================================

# 檢查 Docker 狀態
check_docker_status() {
    log_info "Checking Docker status..."
    
    if ! docker info &> /dev/null; then
        error_exit "Docker is not running or not accessible"
    fi
    
    if ! docker-compose --version &> /dev/null; then
        error_exit "Docker Compose is not installed or not accessible"
    fi
    
    log_success "Docker is running and accessible"
}

# 構建 Docker 映像
build_docker_image() {
    local color="$1"
    local version="$2"
    local image_name="newpennine-wms"
    local tag="${color}-${version}"
    
    log_info "Building Docker image: ${image_name}:${tag}"
    
    # 構建映像
    docker build \
        -f "$PROJECT_ROOT/Dockerfile.prod" \
        -t "${image_name}:${tag}" \
        --build-arg NEXT_PUBLIC_SUPABASE_URL="$NEXT_PUBLIC_SUPABASE_URL" \
        --build-arg NEXT_PUBLIC_SUPABASE_ANON_KEY="$NEXT_PUBLIC_SUPABASE_ANON_KEY" \
        --build-arg SUPABASE_SERVICE_ROLE_KEY="$SUPABASE_SERVICE_ROLE_KEY" \
        --build-arg NEXT_PUBLIC_SITE_URL="$NEXT_PUBLIC_SITE_URL" \
        --build-arg NEXT_PUBLIC_ENVIRONMENT="$ENVIRONMENT" \
        --build-arg NEXT_PUBLIC_API_URL="$NEXT_PUBLIC_API_URL" \
        --progress=plain \
        "$PROJECT_ROOT" || error_exit "Docker build failed"
    
    log_success "Docker image built successfully: ${image_name}:${tag}"
}

# 標記 Docker 映像
tag_docker_image() {
    local color="$1"
    local version="$2"
    local image_name="newpennine-wms"
    local source_tag="${color}-${version}"
    
    log_info "Tagging Docker image..."
    
    # 標記為最新版本
    docker tag "${image_name}:${source_tag}" "${image_name}:${color}-latest" || error_exit "Docker tag failed"
    
    # 標記為通用版本
    docker tag "${image_name}:${source_tag}" "${image_name}:${version}" || error_exit "Docker tag failed"
    
    log_success "Docker image tagged successfully"
}

# 啟動環境
start_environment() {
    local color="$1"
    
    log_info "Starting $color environment..."
    
    # 使用 Docker Compose 啟動特定顏色的服務
    docker-compose -f "$PROJECT_ROOT/docker-compose.prod.yml" up -d "newpennine-$color" || error_exit "Failed to start $color environment"
    
    # 等待容器啟動
    wait_for_container_start "newpennine-$color"
    
    log_success "$color environment started successfully"
}

# 停止環境
stop_environment() {
    local color="$1"
    
    log_info "Stopping $color environment..."
    
    # 停止特定顏色的服務
    docker-compose -f "$PROJECT_ROOT/docker-compose.prod.yml" stop "newpennine-$color" || log_warn "Failed to stop $color environment"
    
    log_success "$color environment stopped"
}

# 重啟環境
restart_environment() {
    local color="$1"
    
    log_info "Restarting $color environment..."
    
    stop_environment "$color"
    sleep 5
    start_environment "$color"
    
    log_success "$color environment restarted"
}

# 等待容器啟動
wait_for_container_start() {
    local container_name="$1"
    local timeout="${2:-120}"
    
    log_info "Waiting for container $container_name to start..."
    
    local count=0
    while [[ $count -lt $timeout ]]; do
        local container_status=$(docker inspect "$container_name" --format='{{.State.Status}}' 2>/dev/null || echo "not_found")
        
        if [[ "$container_status" == "running" ]]; then
            log_success "Container $container_name is running"
            return 0
        fi
        
        sleep 1
        ((count++))
        
        if [[ $((count % 30)) -eq 0 ]]; then
            log_info "Still waiting for container $container_name... ($count/$timeout)"
        fi
    done
    
    error_exit "Container $container_name failed to start within $timeout seconds"
}

# 清理舊容器
cleanup_old_containers() {
    local color="$1"
    
    log_info "Cleaning up old containers for $color environment..."
    
    # 停止並移除舊容器
    local container_name="newpennine-$color"
    
    if docker ps -a | grep -q "$container_name"; then
        docker stop "$container_name" || log_warn "Failed to stop container $container_name"
        docker rm "$container_name" || log_warn "Failed to remove container $container_name"
    fi
    
    log_success "Old containers cleaned up for $color environment"
}

# 清理舊映像
cleanup_old_images() {
    local keep_versions="${1:-3}"
    
    log_info "Cleaning up old Docker images (keeping $keep_versions versions)..."
    
    # 獲取所有 newpennine-wms 映像
    local images=$(docker images --format "table {{.Repository}}:{{.Tag}}" | grep "newpennine-wms" | grep -v "latest" | sort -V)
    
    if [[ -n "$images" ]]; then
        local image_count=$(echo "$images" | wc -l)
        
        if [[ $image_count -gt $keep_versions ]]; then
            local images_to_remove=$(echo "$images" | head -n $((image_count - keep_versions)))
            
            echo "$images_to_remove" | while read -r image; do
                if [[ -n "$image" ]]; then
                    docker rmi "$image" || log_warn "Failed to remove image $image"
                fi
            done
        fi
    fi
    
    log_success "Old Docker images cleaned up"
}

# 獲取容器日誌
get_container_logs() {
    local container_name="$1"
    local lines="${2:-100}"
    
    log_info "Getting logs for container $container_name..."
    
    if docker ps -a | grep -q "$container_name"; then
        docker logs --tail "$lines" "$container_name" || log_warn "Failed to get logs for $container_name"
    else
        log_warn "Container $container_name not found"
    fi
}

# 檢查容器健康狀態
check_container_health() {
    local container_name="$1"
    
    log_info "Checking health of container $container_name..."
    
    if docker ps | grep -q "$container_name"; then
        local health_status=$(docker inspect "$container_name" --format='{{.State.Health.Status}}' 2>/dev/null || echo "no_health_check")
        
        log_info "Container $container_name health status: $health_status"
        
        if [[ "$health_status" == "healthy" ]] || [[ "$health_status" == "no_health_check" ]]; then
            return 0
        else
            return 1
        fi
    else
        log_error "Container $container_name is not running"
        return 1
    fi
}

# 執行容器內命令
execute_in_container() {
    local container_name="$1"
    local command="$2"
    
    log_info "Executing command in container $container_name: $command"
    
    if docker ps | grep -q "$container_name"; then
        docker exec "$container_name" $command || error_exit "Failed to execute command in container $container_name"
    else
        error_exit "Container $container_name is not running"
    fi
}

# 複製文件到容器
copy_to_container() {
    local source_path="$1"
    local container_name="$2"
    local dest_path="$3"
    
    log_info "Copying $source_path to container $container_name:$dest_path"
    
    docker cp "$source_path" "$container_name:$dest_path" || error_exit "Failed to copy file to container"
    
    log_success "File copied to container successfully"
}

# 從容器複製文件
copy_from_container() {
    local container_name="$1"
    local source_path="$2"
    local dest_path="$3"
    
    log_info "Copying $container_name:$source_path to $dest_path"
    
    docker cp "$container_name:$source_path" "$dest_path" || error_exit "Failed to copy file from container"
    
    log_success "File copied from container successfully"
}

# 獲取容器資源使用情況
get_container_stats() {
    local container_name="$1"
    
    log_info "Getting resource usage for container $container_name..."
    
    if docker ps | grep -q "$container_name"; then
        docker stats "$container_name" --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.MemPerc}}\t{{.NetIO}}\t{{.BlockIO}}"
    else
        log_warn "Container $container_name is not running"
    fi
}

# 檢查 Docker 磁碟使用情況
check_docker_disk_usage() {
    log_info "Checking Docker disk usage..."
    
    docker system df || log_warn "Failed to get Docker disk usage"
}

# 清理 Docker 系統
cleanup_docker_system() {
    log_info "Cleaning up Docker system..."
    
    # 清理未使用的容器、網絡、映像和構建緩存
    docker system prune -a -f --volumes || log_warn "Failed to clean Docker system"
    
    log_success "Docker system cleaned up"
}

# 檢查映像是否存在
check_image_exists() {
    local image_name="$1"
    
    if docker images | grep -q "$image_name"; then
        return 0
    else
        return 1
    fi
}

# 拉取映像
pull_image() {
    local image_name="$1"
    
    log_info "Pulling Docker image: $image_name"
    
    docker pull "$image_name" || error_exit "Failed to pull image $image_name"
    
    log_success "Docker image pulled successfully: $image_name"
}

# 推送映像到註冊表
push_image() {
    local image_name="$1"
    local registry="${2:-}"
    
    if [[ -n "$registry" ]]; then
        local full_image_name="$registry/$image_name"
        docker tag "$image_name" "$full_image_name"
        image_name="$full_image_name"
    fi
    
    log_info "Pushing Docker image: $image_name"
    
    docker push "$image_name" || error_exit "Failed to push image $image_name"
    
    log_success "Docker image pushed successfully: $image_name"
}

# 創建 Docker 網絡
create_docker_network() {
    local network_name="$1"
    local subnet="${2:-}"
    
    log_info "Creating Docker network: $network_name"
    
    local network_cmd="docker network create $network_name"
    
    if [[ -n "$subnet" ]]; then
        network_cmd="$network_cmd --subnet $subnet"
    fi
    
    if ! docker network ls | grep -q "$network_name"; then
        eval "$network_cmd" || error_exit "Failed to create Docker network $network_name"
        log_success "Docker network created: $network_name"
    else
        log_info "Docker network already exists: $network_name"
    fi
}

# 檢查 Docker Compose 服務狀態
check_compose_service_status() {
    local service_name="$1"
    
    log_info "Checking Docker Compose service status: $service_name"
    
    local status=$(docker-compose -f "$PROJECT_ROOT/docker-compose.prod.yml" ps -q "$service_name" | xargs docker inspect --format='{{.State.Status}}' 2>/dev/null || echo "not_found")
    
    log_info "Service $service_name status: $status"
    echo "$status"
}

# 重啟 Docker Compose 服務
restart_compose_service() {
    local service_name="$1"
    
    log_info "Restarting Docker Compose service: $service_name"
    
    docker-compose -f "$PROJECT_ROOT/docker-compose.prod.yml" restart "$service_name" || error_exit "Failed to restart service $service_name"
    
    log_success "Service $service_name restarted successfully"
}

# 縮放 Docker Compose 服務
scale_compose_service() {
    local service_name="$1"
    local scale_count="$2"
    
    log_info "Scaling Docker Compose service $service_name to $scale_count instances"
    
    docker-compose -f "$PROJECT_ROOT/docker-compose.prod.yml" up -d --scale "$service_name=$scale_count" || error_exit "Failed to scale service $service_name"
    
    log_success "Service $service_name scaled to $scale_count instances"
}

# 獲取 Docker Compose 服務日誌
get_compose_service_logs() {
    local service_name="$1"
    local lines="${2:-100}"
    
    log_info "Getting logs for Docker Compose service: $service_name"
    
    docker-compose -f "$PROJECT_ROOT/docker-compose.prod.yml" logs --tail "$lines" "$service_name" || log_warn "Failed to get logs for service $service_name"
}
#!/bin/bash

# =================================================================
# 性能監控腳本
# 作者: DevOps Team
# 版本: 1.0.0
# 描述: 系統性能監控和告警腳本
# =================================================================

# 監控配置
readonly MONITORING_CONFIG="$CONFIG_DIR/monitoring.json"
readonly METRICS_DIR="$LOGS_DIR/metrics"
readonly ALERTS_DIR="$LOGS_DIR/alerts"
readonly PERFORMANCE_THRESHOLD_FILE="$CONFIG_DIR/performance_thresholds.json"

# 創建必要目錄
mkdir -p "$METRICS_DIR" "$ALERTS_DIR"

# 主要性能監控函數
monitor_system_performance() {
    local interval="${1:-30}"  # 監控間隔，默認30秒
    local duration="${2:-3600}"  # 監控持續時間，默認1小時
    
    log_info "Starting system performance monitoring (interval: ${interval}s, duration: ${duration}s)..."
    
    local start_time=$(date +%s)
    local end_time=$((start_time + duration))
    
    while [[ $(date +%s) -lt $end_time ]]; do
        # 收集系統指標
        collect_system_metrics
        
        # 收集應用指標
        collect_application_metrics
        
        # 收集資料庫指標
        collect_database_metrics
        
        # 收集容器指標
        collect_container_metrics
        
        # 檢查告警條件
        check_performance_alerts
        
        sleep "$interval"
    done
    
    log_success "System performance monitoring completed"
}

# 收集系統指標
collect_system_metrics() {
    local timestamp=$(date +%s)
    local metrics_file="$METRICS_DIR/system_metrics_${timestamp}.json"
    
    # CPU 使用率
    local cpu_usage=$(top -bn1 | grep "Cpu(s)" | awk '{print $2}' | sed 's/%us,//')
    
    # 記憶體使用率
    local memory_info=$(free -m | awk 'NR==2{printf "%.2f", $3*100/$2}')
    
    # 磁碟使用率
    local disk_usage=$(df -h / | awk 'NR==2{print $5}' | sed 's/%//')
    
    # 網絡統計
    local network_stats=$(cat /proc/net/dev | grep -E "(eth0|ens|enp)" | head -1 | awk '{print $2,$10}')
    local rx_bytes=$(echo "$network_stats" | awk '{print $1}')
    local tx_bytes=$(echo "$network_stats" | awk '{print $2}')
    
    # 負載平均
    local load_avg=$(uptime | awk -F'load average:' '{print $2}' | sed 's/,//g')
    
    # 進程數
    local process_count=$(ps aux | wc -l)
    
    # 打開文件描述符
    local open_files=$(lsof 2>/dev/null | wc -l)
    
    # 創建指標 JSON
    jq -n \
        --arg timestamp "$timestamp" \
        --arg cpu_usage "$cpu_usage" \
        --arg memory_usage "$memory_info" \
        --arg disk_usage "$disk_usage" \
        --arg rx_bytes "$rx_bytes" \
        --arg tx_bytes "$tx_bytes" \
        --arg load_avg "$load_avg" \
        --arg process_count "$process_count" \
        --arg open_files "$open_files" \
        '{
            timestamp: $timestamp,
            cpu_usage: ($cpu_usage | tonumber),
            memory_usage: ($memory_usage | tonumber),
            disk_usage: ($disk_usage | tonumber),
            network: {
                rx_bytes: ($rx_bytes | tonumber),
                tx_bytes: ($tx_bytes | tonumber)
            },
            load_avg: $load_avg,
            process_count: ($process_count | tonumber),
            open_files: ($open_files | tonumber)
        }' > "$metrics_file"
    
    # 發送到監控系統
    send_metrics_to_monitoring_system "$metrics_file"
}

# 收集應用指標
collect_application_metrics() {
    local timestamp=$(date +%s)
    local metrics_file="$METRICS_DIR/app_metrics_${timestamp}.json"
    
    # 檢查藍綠環境
    local blue_metrics=$(collect_app_metrics_for_color "blue")
    local green_metrics=$(collect_app_metrics_for_color "green")
    
    # 創建應用指標 JSON
    jq -n \
        --arg timestamp "$timestamp" \
        --argjson blue "$blue_metrics" \
        --argjson green "$green_metrics" \
        '{
            timestamp: $timestamp,
            environments: {
                blue: $blue,
                green: $green
            }
        }' > "$metrics_file"
    
    send_metrics_to_monitoring_system "$metrics_file"
}

# 收集特定顏色環境的應用指標
collect_app_metrics_for_color() {
    local color="$1"
    local port
    
    case "$color" in
        blue) port=3001 ;;
        green) port=3002 ;;
        *) echo '{"status": "unknown"}'; return ;;
    esac
    
    # 檢查服務是否運行
    if ! curl -f -s "http://localhost:$port/api/v1/health" &>/dev/null; then
        echo '{"status": "down"}'
        return
    fi
    
    # 獲取應用指標
    local health_response=$(curl -s "http://localhost:$port/api/v1/health" || echo '{}')
    local metrics_response=$(curl -s "http://localhost:$port/api/v1/metrics" || echo '{}')
    
    # 測量響應時間
    local response_time=$(curl -o /dev/null -s -w "%{time_total}" "http://localhost:$port/api/v1/health" || echo "0")
    
    # 合併指標
    echo "$health_response" | jq \
        --argjson metrics "$metrics_response" \
        --arg response_time "$response_time" \
        --arg port "$port" \
        '. + $metrics + {
            response_time: ($response_time | tonumber * 1000),
            port: ($port | tonumber),
            status: "up"
        }'
}

# 收集資料庫指標
collect_database_metrics() {
    local timestamp=$(date +%s)
    local metrics_file="$METRICS_DIR/db_metrics_${timestamp}.json"
    
    # 檢查資料庫連接
    if ! check_database_connection &>/dev/null; then
        echo '{"status": "down", "timestamp": "'$timestamp'"}' > "$metrics_file"
        return
    fi
    
    local connection_string=$(convert_supabase_url_to_psql "$NEXT_PUBLIC_SUPABASE_URL")
    
    # 收集資料庫統計
    local db_stats=$(psql "$connection_string" -t -c "
        SELECT json_build_object(
            'active_connections', (SELECT count(*) FROM pg_stat_activity WHERE state = 'active'),
            'idle_connections', (SELECT count(*) FROM pg_stat_activity WHERE state = 'idle'),
            'database_size', (SELECT pg_size_pretty(pg_database_size(current_database()))),
            'database_size_bytes', (SELECT pg_database_size(current_database())),
            'transactions_committed', (SELECT xact_commit FROM pg_stat_database WHERE datname = current_database()),
            'transactions_rolled_back', (SELECT xact_rollback FROM pg_stat_database WHERE datname = current_database()),
            'blocks_read', (SELECT blks_read FROM pg_stat_database WHERE datname = current_database()),
            'blocks_hit', (SELECT blks_hit FROM pg_stat_database WHERE datname = current_database()),
            'temp_files', (SELECT temp_files FROM pg_stat_database WHERE datname = current_database()),
            'temp_bytes', (SELECT temp_bytes FROM pg_stat_database WHERE datname = current_database())
        );
    " 2>/dev/null || echo '{}')
    
    # 獲取慢查詢
    local slow_queries=$(psql "$connection_string" -t -c "
        SELECT json_agg(json_build_object(
            'query', substring(query, 1, 100),
            'mean_time', round(mean_time::numeric, 2),
            'calls', calls,
            'total_time', round(total_time::numeric, 2)
        ))
        FROM pg_stat_statements
        WHERE mean_time > 100
        ORDER BY mean_time DESC
        LIMIT 10;
    " 2>/dev/null || echo '[]')
    
    # 創建資料庫指標 JSON
    jq -n \
        --arg timestamp "$timestamp" \
        --argjson db_stats "$db_stats" \
        --argjson slow_queries "$slow_queries" \
        '{
            timestamp: $timestamp,
            status: "up",
            database: $db_stats,
            slow_queries: $slow_queries
        }' > "$metrics_file"
    
    send_metrics_to_monitoring_system "$metrics_file"
}

# 收集容器指標
collect_container_metrics() {
    local timestamp=$(date +%s)
    local metrics_file="$METRICS_DIR/container_metrics_${timestamp}.json"
    
    # 獲取所有容器的統計
    local containers=("newpennine-blue" "newpennine-green" "newpennine-nginx" "newpennine-redis")
    local container_stats='[]'
    
    for container in "${containers[@]}"; do
        if docker ps | grep -q "$container"; then
            local stats=$(docker stats "$container" --no-stream --format "{{.CPUPerc}},{{.MemUsage}},{{.MemPerc}},{{.NetIO}},{{.BlockIO}}")
            
            IFS=',' read -r cpu_perc mem_usage mem_perc net_io block_io <<< "$stats"
            
            # 解析記憶體使用
            local mem_used=$(echo "$mem_usage" | cut -d'/' -f1 | sed 's/[^0-9.]//g')
            local mem_total=$(echo "$mem_usage" | cut -d'/' -f2 | sed 's/[^0-9.]//g')
            
            # 解析網絡 I/O
            local net_rx=$(echo "$net_io" | cut -d'/' -f1 | sed 's/[^0-9.]//g')
            local net_tx=$(echo "$net_io" | cut -d'/' -f2 | sed 's/[^0-9.]//g')
            
            # 創建容器統計
            local container_stat=$(jq -n \
                --arg name "$container" \
                --arg cpu_perc "$cpu_perc" \
                --arg mem_used "$mem_used" \
                --arg mem_total "$mem_total" \
                --arg mem_perc "$mem_perc" \
                --arg net_rx "$net_rx" \
                --arg net_tx "$net_tx" \
                --arg block_io "$block_io" \
                '{
                    name: $name,
                    cpu_percent: ($cpu_perc | gsub("%"; "") | tonumber),
                    memory: {
                        used: ($mem_used | tonumber),
                        total: ($mem_total | tonumber),
                        percent: ($mem_perc | gsub("%"; "") | tonumber)
                    },
                    network: {
                        rx: ($net_rx | tonumber),
                        tx: ($net_tx | tonumber)
                    },
                    block_io: $block_io,
                    status: "running"
                }')
            
            container_stats=$(echo "$container_stats" | jq ". + [$container_stat]")
        else
            local container_stat=$(jq -n \
                --arg name "$container" \
                '{
                    name: $name,
                    status: "stopped"
                }')
            
            container_stats=$(echo "$container_stats" | jq ". + [$container_stat]")
        fi
    done
    
    # 創建容器指標 JSON
    jq -n \
        --arg timestamp "$timestamp" \
        --argjson containers "$container_stats" \
        '{
            timestamp: $timestamp,
            containers: $containers
        }' > "$metrics_file"
    
    send_metrics_to_monitoring_system "$metrics_file"
}

# 檢查性能告警
check_performance_alerts() {
    local thresholds=$(load_performance_thresholds)
    
    # 檢查 CPU 使用率
    local cpu_usage=$(top -bn1 | grep "Cpu(s)" | awk '{print $2}' | sed 's/%us,//')
    local cpu_threshold=$(echo "$thresholds" | jq -r '.cpu_usage_threshold // 80')
    
    if (( $(echo "$cpu_usage > $cpu_threshold" | bc -l) )); then
        trigger_alert "HIGH_CPU_USAGE" "CPU usage is ${cpu_usage}% (threshold: ${cpu_threshold}%)" "warning"
    fi
    
    # 檢查記憶體使用率
    local memory_usage=$(free -m | awk 'NR==2{printf "%.2f", $3*100/$2}')
    local memory_threshold=$(echo "$thresholds" | jq -r '.memory_usage_threshold // 80')
    
    if (( $(echo "$memory_usage > $memory_threshold" | bc -l) )); then
        trigger_alert "HIGH_MEMORY_USAGE" "Memory usage is ${memory_usage}% (threshold: ${memory_threshold}%)" "warning"
    fi
    
    # 檢查磁碟使用率
    local disk_usage=$(df -h / | awk 'NR==2{print $5}' | sed 's/%//')
    local disk_threshold=$(echo "$thresholds" | jq -r '.disk_usage_threshold // 85')
    
    if (( $(echo "$disk_usage > $disk_threshold" | bc -l) )); then
        trigger_alert "HIGH_DISK_USAGE" "Disk usage is ${disk_usage}% (threshold: ${disk_threshold}%)" "critical"
    fi
    
    # 檢查應用響應時間
    check_application_response_times "$thresholds"
    
    # 檢查資料庫連接
    check_database_connection_alerts "$thresholds"
}

# 檢查應用響應時間
check_application_response_times() {
    local thresholds="$1"
    local response_time_threshold=$(echo "$thresholds" | jq -r '.response_time_threshold // 2000')
    
    local colors=("blue" "green")
    
    for color in "${colors[@]}"; do
        local port
        case "$color" in
            blue) port=3001 ;;
            green) port=3002 ;;
        esac
        
        if curl -f -s "http://localhost:$port/api/v1/health" &>/dev/null; then
            local response_time=$(curl -o /dev/null -s -w "%{time_total}" "http://localhost:$port/api/v1/health" || echo "0")
            local response_time_ms=$(echo "$response_time * 1000" | bc)
            
            if (( $(echo "$response_time_ms > $response_time_threshold" | bc -l) )); then
                trigger_alert "HIGH_RESPONSE_TIME" "Response time for $color environment is ${response_time_ms}ms (threshold: ${response_time_threshold}ms)" "warning"
            fi
        fi
    done
}

# 檢查資料庫連接告警
check_database_connection_alerts() {
    local thresholds="$1"
    local connection_threshold=$(echo "$thresholds" | jq -r '.db_connection_threshold // 80')
    
    if check_database_connection &>/dev/null; then
        local connection_string=$(convert_supabase_url_to_psql "$NEXT_PUBLIC_SUPABASE_URL")
        local active_connections=$(psql "$connection_string" -t -c "SELECT count(*) FROM pg_stat_activity WHERE state = 'active';" 2>/dev/null || echo "0")
        
        if [[ $active_connections -gt $connection_threshold ]]; then
            trigger_alert "HIGH_DB_CONNECTIONS" "Database has $active_connections active connections (threshold: $connection_threshold)" "warning"
        fi
    else
        trigger_alert "DB_CONNECTION_FAILED" "Database connection failed" "critical"
    fi
}

# 觸發告警
trigger_alert() {
    local alert_type="$1"
    local message="$2"
    local severity="${3:-warning}"
    
    local alert_id="${alert_type}_$(date +%s)"
    local alert_file="$ALERTS_DIR/${alert_id}.json"
    
    # 創建告警記錄
    jq -n \
        --arg id "$alert_id" \
        --arg type "$alert_type" \
        --arg message "$message" \
        --arg severity "$severity" \
        --arg timestamp "$(date -u +%Y-%m-%dT%H:%M:%SZ)" \
        --arg hostname "$(hostname)" \
        '{
            id: $id,
            type: $type,
            message: $message,
            severity: $severity,
            timestamp: $timestamp,
            hostname: $hostname,
            status: "active"
        }' > "$alert_file"
    
    log_warn "ALERT [$severity]: $message"
    
    # 發送告警通知
    send_alert_notification "$alert_file"
    
    # 記錄告警歷史
    record_alert_history "$alert_file"
}

# 發送告警通知
send_alert_notification() {
    local alert_file="$1"
    local alert_data=$(cat "$alert_file")
    
    local alert_type=$(echo "$alert_data" | jq -r '.type')
    local message=$(echo "$alert_data" | jq -r '.message')
    local severity=$(echo "$alert_data" | jq -r '.severity')
    
    # 根據嚴重程度決定通知方式
    case "$severity" in
        critical)
            send_failure_notification "CRITICAL ALERT: $message" "$alert_data"
            ;;
        warning)
            send_warning_notification "WARNING: $message" "$alert_data"
            ;;
        info)
            # 只記錄，不發送通知
            ;;
    esac
}

# 記錄告警歷史
record_alert_history() {
    local alert_file="$1"
    local history_file="$ALERTS_DIR/alert_history.json"
    
    if [[ ! -f "$history_file" ]]; then
        echo '[]' > "$history_file"
    fi
    
    local alert_data=$(cat "$alert_file")
    local updated_history=$(cat "$history_file" | jq ". + [$alert_data]")
    
    echo "$updated_history" > "$history_file"
}

# 載入性能閾值
load_performance_thresholds() {
    if [[ -f "$PERFORMANCE_THRESHOLD_FILE" ]]; then
        cat "$PERFORMANCE_THRESHOLD_FILE"
    else
        # 默認閾值
        echo '{
            "cpu_usage_threshold": 80,
            "memory_usage_threshold": 80,
            "disk_usage_threshold": 85,
            "response_time_threshold": 2000,
            "db_connection_threshold": 80
        }'
    fi
}

# 創建性能閾值配置
create_performance_thresholds_config() {
    local config_dir=$(dirname "$PERFORMANCE_THRESHOLD_FILE")
    mkdir -p "$config_dir"
    
    cat > "$PERFORMANCE_THRESHOLD_FILE" << EOF
{
    "cpu_usage_threshold": 80,
    "memory_usage_threshold": 80,
    "disk_usage_threshold": 85,
    "response_time_threshold": 2000,
    "db_connection_threshold": 80,
    "load_average_threshold": 4.0,
    "process_count_threshold": 300,
    "open_files_threshold": 10000,
    "network_rx_threshold": 1000000000,
    "network_tx_threshold": 1000000000
}
EOF
    
    log_success "Performance thresholds configuration created: $PERFORMANCE_THRESHOLD_FILE"
}

# 發送指標到監控系統
send_metrics_to_monitoring_system() {
    local metrics_file="$1"
    
    # 發送到 Prometheus（如果配置了）
    send_to_prometheus "$metrics_file"
    
    # 發送到 InfluxDB（如果配置了）
    send_to_influxdb "$metrics_file"
    
    # 發送到自定義監控端點
    send_to_custom_monitoring "$metrics_file"
}

# 發送到 Prometheus
send_to_prometheus() {
    local metrics_file="$1"
    local prometheus_gateway=$(get_monitoring_config "prometheus.gateway_url")
    
    if [[ -z "$prometheus_gateway" ]] || [[ "$prometheus_gateway" == "null" ]]; then
        return 0
    fi
    
    # 轉換 JSON 指標為 Prometheus 格式
    local prometheus_metrics=$(convert_json_to_prometheus_format "$metrics_file")
    
    # 推送到 Prometheus Push Gateway
    curl -X POST \
        -H "Content-Type: text/plain" \
        -d "$prometheus_metrics" \
        "$prometheus_gateway/metrics/job/newpennine-wms/instance/$(hostname)" \
        &>/dev/null
}

# 發送到 InfluxDB
send_to_influxdb() {
    local metrics_file="$1"
    local influxdb_url=$(get_monitoring_config "influxdb.url")
    local influxdb_token=$(get_monitoring_config "influxdb.token")
    local influxdb_org=$(get_monitoring_config "influxdb.org")
    local influxdb_bucket=$(get_monitoring_config "influxdb.bucket")
    
    if [[ -z "$influxdb_url" ]] || [[ "$influxdb_url" == "null" ]]; then
        return 0
    fi
    
    # 轉換 JSON 指標為 InfluxDB 行協議格式
    local influxdb_data=$(convert_json_to_influxdb_format "$metrics_file")
    
    # 發送到 InfluxDB
    curl -X POST \
        -H "Authorization: Token $influxdb_token" \
        -H "Content-Type: text/plain" \
        -d "$influxdb_data" \
        "$influxdb_url/api/v2/write?org=$influxdb_org&bucket=$influxdb_bucket" \
        &>/dev/null
}

# 發送到自定義監控端點
send_to_custom_monitoring() {
    local metrics_file="$1"
    local custom_endpoint=$(get_monitoring_config "custom.endpoint")
    
    if [[ -z "$custom_endpoint" ]] || [[ "$custom_endpoint" == "null" ]]; then
        return 0
    fi
    
    # 直接發送 JSON 數據
    curl -X POST \
        -H "Content-Type: application/json" \
        -d "@$metrics_file" \
        "$custom_endpoint" \
        &>/dev/null
}

# 轉換 JSON 到 Prometheus 格式
convert_json_to_prometheus_format() {
    local metrics_file="$1"
    local metrics_data=$(cat "$metrics_file")
    
    # 提取指標並轉換為 Prometheus 格式
    echo "$metrics_data" | jq -r '
        to_entries |
        map(
            if (.value | type) == "number" then
                "newpennine_" + .key + " " + (.value | tostring)
            else
                empty
            end
        ) |
        join("\n")
    '
}

# 轉換 JSON 到 InfluxDB 格式
convert_json_to_influxdb_format() {
    local metrics_file="$1"
    local metrics_data=$(cat "$metrics_file")
    local timestamp=$(echo "$metrics_data" | jq -r '.timestamp')
    
    # 轉換為 InfluxDB 行協議格式
    echo "$metrics_data" | jq -r \
        --arg timestamp "$timestamp" \
        'to_entries |
        map(
            if (.value | type) == "number" then
                "newpennine_metrics," + "host=" + env.HOSTNAME + " " + .key + "=" + (.value | tostring) + " " + ($timestamp + "000000000")
            else
                empty
            end
        ) |
        join("\n")'
}

# 獲取監控配置
get_monitoring_config() {
    local config_path="$1"
    
    if [[ -f "$MONITORING_CONFIG" ]]; then
        jq -r ".$config_path // empty" "$MONITORING_CONFIG" 2>/dev/null
    else
        echo ""
    fi
}

# 創建監控配置
create_monitoring_config() {
    local config_dir=$(dirname "$MONITORING_CONFIG")
    mkdir -p "$config_dir"
    
    cat > "$MONITORING_CONFIG" << EOF
{
    "prometheus": {
        "gateway_url": "",
        "job_name": "newpennine-wms",
        "instance": "$(hostname)"
    },
    "influxdb": {
        "url": "",
        "token": "",
        "org": "",
        "bucket": "newpennine-metrics"
    },
    "custom": {
        "endpoint": ""
    },
    "alerts": {
        "enable_slack": true,
        "enable_email": true,
        "enable_webhook": true
    },
    "settings": {
        "monitoring_interval": 30,
        "retention_days": 7,
        "enable_system_metrics": true,
        "enable_app_metrics": true,
        "enable_db_metrics": true,
        "enable_container_metrics": true
    }
}
EOF
    
    log_success "Monitoring configuration created: $MONITORING_CONFIG"
}

# 生成性能報告
generate_performance_report() {
    local duration="${1:-3600}"  # 默認最近1小時
    local report_file="$LOGS_DIR/performance_report_$(date +%Y%m%d_%H%M%S).html"
    
    log_info "Generating performance report for the last $duration seconds..."
    
    # 收集指標文件
    local metrics_files=($(find "$METRICS_DIR" -name "*.json" -newermt "@$(($(date +%s) - duration))" | sort))
    
    if [[ ${#metrics_files[@]} -eq 0 ]]; then
        log_warn "No metrics files found for the specified duration"
        return 1
    fi
    
    # 生成 HTML 報告
    cat > "$report_file" << EOF
<!DOCTYPE html>
<html>
<head>
    <title>NewPennine WMS Performance Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .metric { margin: 10px 0; padding: 10px; border: 1px solid #ddd; }
        .critical { background-color: #ffe6e6; }
        .warning { background-color: #fff3cd; }
        .normal { background-color: #e6f7ff; }
        table { width: 100%; border-collapse: collapse; }
        th, td { padding: 8px; text-align: left; border: 1px solid #ddd; }
        th { background-color: #f2f2f2; }
    </style>
</head>
<body>
    <h1>NewPennine WMS Performance Report</h1>
    <p>Generated: $(date)</p>
    <p>Duration: $duration seconds</p>
    <p>Metrics files analyzed: ${#metrics_files[@]}</p>
    
    <h2>Summary</h2>
    <div id="summary">
        <!-- Summary will be populated by JavaScript -->
    </div>
    
    <h2>System Metrics</h2>
    <div id="system-metrics">
        <!-- System metrics will be populated -->
    </div>
    
    <h2>Application Metrics</h2>
    <div id="app-metrics">
        <!-- Application metrics will be populated -->
    </div>
    
    <h2>Database Metrics</h2>
    <div id="db-metrics">
        <!-- Database metrics will be populated -->
    </div>
    
    <h2>Container Metrics</h2>
    <div id="container-metrics">
        <!-- Container metrics will be populated -->
    </div>
    
    <h2>Alerts</h2>
    <div id="alerts">
        <!-- Alerts will be populated -->
    </div>
    
    <script>
        // JavaScript to populate the report with data
        // This would typically fetch data from the metrics files
        document.getElementById('summary').innerHTML = '<p>Report generation completed successfully</p>';
    </script>
</body>
</html>
EOF
    
    log_success "Performance report generated: $report_file"
    echo "$report_file"
}

# 清理舊指標文件
cleanup_old_metrics() {
    local retention_days="${1:-7}"
    
    log_info "Cleaning up metrics files older than $retention_days days..."
    
    find "$METRICS_DIR" -name "*.json" -mtime +$retention_days -delete
    find "$ALERTS_DIR" -name "*.json" -mtime +$retention_days -delete
    
    log_success "Old metrics files cleaned up"
}

# 主監控循環
main_monitoring_loop() {
    log_info "Starting main monitoring loop..."
    
    # 創建配置文件（如果不存在）
    if [[ ! -f "$MONITORING_CONFIG" ]]; then
        create_monitoring_config
    fi
    
    if [[ ! -f "$PERFORMANCE_THRESHOLD_FILE" ]]; then
        create_performance_thresholds_config
    fi
    
    # 開始監控
    while true; do
        monitor_system_performance 30 300  # 每30秒監控一次，持續5分鐘
        sleep 60  # 休息1分鐘
    done
}

# 如果腳本直接運行，啟動監控
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main_monitoring_loop
fi
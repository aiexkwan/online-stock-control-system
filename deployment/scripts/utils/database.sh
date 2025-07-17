#!/bin/bash

# =================================================================
# 資料庫管理工具函數
# 作者: Backend Team
# 版本: 1.0.0
# 描述: 資料庫遷移、備份、同步和健康檢查工具函數
# =================================================================

# 檢查資料庫連接
check_database_connection() {
    log_info "Checking database connection..."
    
    local db_url="${DATABASE_URL:-$NEXT_PUBLIC_SUPABASE_URL}"
    local db_key="${DATABASE_KEY:-$SUPABASE_SERVICE_ROLE_KEY}"
    
    if [[ -z "$db_url" ]] || [[ -z "$db_key" ]]; then
        error_exit "Database connection parameters not configured"
    fi
    
    # 使用 psql 測試連接
    local connection_string=$(convert_supabase_url_to_psql "$db_url")
    
    if psql "$connection_string" -c "SELECT 1;" &>/dev/null; then
        log_success "Database connection successful"
        return 0
    else
        error_exit "Database connection failed"
    fi
}

# 轉換 Supabase URL 到 psql 連接字符串
convert_supabase_url_to_psql() {
    local supabase_url="$1"
    
    # 從 Supabase URL 提取連接資訊
    local db_host=$(echo "$supabase_url" | sed -n 's|https://\([^.]*\)\.supabase\.co.*|\1|p')
    local db_name="postgres"
    local db_user="postgres"
    local db_port="5432"
    
    echo "postgresql://$db_user:$SUPABASE_DB_PASSWORD@db.$db_host.supabase.co:$db_port/$db_name"
}

# 創建資料庫備份
create_database_backup() {
    log_info "Creating database backup..."
    
    local backup_dir=$(create_backup_directory)
    local backup_file="$backup_dir/database_backup_${TIMESTAMP}.sql"
    local connection_string=$(convert_supabase_url_to_psql "$NEXT_PUBLIC_SUPABASE_URL")
    
    # 創建完整備份
    if pg_dump "$connection_string" \
        --verbose \
        --clean \
        --create \
        --if-exists \
        --format=plain \
        --file="$backup_file" \
        --exclude-table-data='auth.*' \
        --exclude-table-data='storage.*' \
        --exclude-table-data='realtime.*'; then
        
        log_success "Database backup created: $backup_file"
        
        # 壓縮備份文件
        gzip "$backup_file"
        log_success "Database backup compressed: ${backup_file}.gz"
        
        # 驗證備份文件
        if [[ -f "${backup_file}.gz" ]]; then
            local backup_size=$(stat -c%s "${backup_file}.gz")
            log_info "Backup file size: $backup_size bytes"
            
            if [[ $backup_size -gt 1000 ]]; then
                log_success "Database backup validation passed"
                echo "${backup_file}.gz"
            else
                error_exit "Database backup file is too small, possible corruption"
            fi
        fi
    else
        error_exit "Database backup failed"
    fi
}

# 恢復資料庫備份
restore_database_backup() {
    local backup_file="$1"
    
    log_info "Restoring database backup: $backup_file"
    
    if [[ ! -f "$backup_file" ]]; then
        error_exit "Backup file not found: $backup_file"
    fi
    
    local connection_string=$(convert_supabase_url_to_psql "$NEXT_PUBLIC_SUPABASE_URL")
    
    # 解壓縮備份文件（如果需要）
    local restore_file="$backup_file"
    if [[ "$backup_file" == *.gz ]]; then
        restore_file="${backup_file%.gz}"
        gunzip -c "$backup_file" > "$restore_file"
    fi
    
    # 執行恢復
    if psql "$connection_string" -f "$restore_file"; then
        log_success "Database backup restored successfully"
        
        # 清理解壓縮的臨時文件
        if [[ "$backup_file" == *.gz ]]; then
            rm -f "$restore_file"
        fi
    else
        error_exit "Database backup restore failed"
    fi
}

# 運行資料庫遷移
run_migration_scripts() {
    log_info "Running database migration scripts..."
    
    local migration_dir="$PROJECT_ROOT/database/migrations"
    local connection_string=$(convert_supabase_url_to_psql "$NEXT_PUBLIC_SUPABASE_URL")
    
    if [[ ! -d "$migration_dir" ]]; then
        log_warn "Migration directory not found: $migration_dir"
        return 0
    fi
    
    # 創建遷移狀態表
    create_migration_table
    
    # 獲取已執行的遷移
    local executed_migrations=$(get_executed_migrations)
    
    # 執行未執行的遷移
    local migration_files=$(find "$migration_dir" -name "*.sql" | sort)
    
    for migration_file in $migration_files; do
        local migration_name=$(basename "$migration_file")
        
        if ! echo "$executed_migrations" | grep -q "$migration_name"; then
            log_info "Executing migration: $migration_name"
            
            if psql "$connection_string" -f "$migration_file"; then
                # 記錄成功的遷移
                record_migration_success "$migration_name"
                log_success "Migration completed: $migration_name"
            else
                error_exit "Migration failed: $migration_name"
            fi
        else
            log_info "Migration already executed: $migration_name"
        fi
    done
    
    log_success "Database migration completed"
}

# 創建遷移狀態表
create_migration_table() {
    local connection_string=$(convert_supabase_url_to_psql "$NEXT_PUBLIC_SUPABASE_URL")
    
    psql "$connection_string" -c "
        CREATE TABLE IF NOT EXISTS migration_history (
            id SERIAL PRIMARY KEY,
            migration_name VARCHAR(255) NOT NULL UNIQUE,
            executed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            execution_time_ms INTEGER,
            success BOOLEAN DEFAULT TRUE
        );
    " &>/dev/null
}

# 獲取已執行的遷移
get_executed_migrations() {
    local connection_string=$(convert_supabase_url_to_psql "$NEXT_PUBLIC_SUPABASE_URL")
    
    psql "$connection_string" -t -c "
        SELECT migration_name 
        FROM migration_history 
        WHERE success = TRUE;
    " 2>/dev/null | tr -d ' '
}

# 記錄遷移成功
record_migration_success() {
    local migration_name="$1"
    local connection_string=$(convert_supabase_url_to_psql "$NEXT_PUBLIC_SUPABASE_URL")
    
    psql "$connection_string" -c "
        INSERT INTO migration_history (migration_name) 
        VALUES ('$migration_name');
    " &>/dev/null
}

# 資料庫健康檢查
check_database_health() {
    log_info "Performing database health check..."
    
    local connection_string=$(convert_supabase_url_to_psql "$NEXT_PUBLIC_SUPABASE_URL")
    local health_report=""
    
    # 檢查連接數
    local connection_count=$(psql "$connection_string" -t -c "
        SELECT count(*) 
        FROM pg_stat_activity 
        WHERE state = 'active';
    " 2>/dev/null | tr -d ' ')
    
    health_report+="Active connections: $connection_count\n"
    
    # 檢查資料庫大小
    local db_size=$(psql "$connection_string" -t -c "
        SELECT pg_size_pretty(pg_database_size(current_database()));
    " 2>/dev/null | tr -d ' ')
    
    health_report+="Database size: $db_size\n"
    
    # 檢查表統計
    local table_count=$(psql "$connection_string" -t -c "
        SELECT count(*) 
        FROM information_schema.tables 
        WHERE table_schema = 'public';
    " 2>/dev/null | tr -d ' ')
    
    health_report+="Public tables: $table_count\n"
    
    # 檢查索引健康
    local index_issues=$(psql "$connection_string" -t -c "
        SELECT count(*) 
        FROM pg_stat_user_indexes 
        WHERE idx_scan = 0 AND idx_tup_read = 0;
    " 2>/dev/null | tr -d ' ')
    
    health_report+="Unused indexes: $index_issues\n"
    
    # 檢查長時間運行的查詢
    local long_queries=$(psql "$connection_string" -t -c "
        SELECT count(*) 
        FROM pg_stat_activity 
        WHERE state = 'active' AND now() - query_start > interval '5 minutes';
    " 2>/dev/null | tr -d ' ')
    
    health_report+="Long running queries: $long_queries\n"
    
    log_info "Database health report:\n$health_report"
    
    # 檢查是否有問題
    if [[ $connection_count -gt 100 ]] || [[ $long_queries -gt 5 ]]; then
        log_warn "Database health check shows potential issues"
        return 1
    else
        log_success "Database health check passed"
        return 0
    fi
}

# 清理資料庫緩存
cleanup_database_cache() {
    log_info "Cleaning up database cache..."
    
    local connection_string=$(convert_supabase_url_to_psql "$NEXT_PUBLIC_SUPABASE_URL")
    
    # 清理查詢緩存
    psql "$connection_string" -c "
        SELECT pg_stat_reset();
        SELECT pg_stat_statements_reset();
    " &>/dev/null
    
    log_success "Database cache cleaned"
}

# 更新表統計
update_table_statistics() {
    log_info "Updating table statistics..."
    
    local connection_string=$(convert_supabase_url_to_psql "$NEXT_PUBLIC_SUPABASE_URL")
    
    # 更新統計信息
    psql "$connection_string" -c "
        ANALYZE;
        VACUUM ANALYZE;
    " &>/dev/null
    
    log_success "Table statistics updated"
}

# 檢查表空間
check_table_space() {
    log_info "Checking table space usage..."
    
    local connection_string=$(convert_supabase_url_to_psql "$NEXT_PUBLIC_SUPABASE_URL")
    
    local table_sizes=$(psql "$connection_string" -c "
        SELECT 
            schemaname,
            tablename,
            pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
        FROM pg_tables 
        WHERE schemaname = 'public'
        ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC
        LIMIT 10;
    " 2>/dev/null)
    
    log_info "Top 10 largest tables:\n$table_sizes"
}

# 檢查索引使用情況
check_index_usage() {
    log_info "Checking index usage..."
    
    local connection_string=$(convert_supabase_url_to_psql "$NEXT_PUBLIC_SUPABASE_URL")
    
    local index_usage=$(psql "$connection_string" -c "
        SELECT 
            indexrelname,
            idx_scan,
            idx_tup_read,
            idx_tup_fetch
        FROM pg_stat_user_indexes
        WHERE idx_scan < 10
        ORDER BY idx_scan;
    " 2>/dev/null)
    
    log_info "Low usage indexes:\n$index_usage"
}

# 檢查鎖定情況
check_database_locks() {
    log_info "Checking database locks..."
    
    local connection_string=$(convert_supabase_url_to_psql "$NEXT_PUBLIC_SUPABASE_URL")
    
    local locks=$(psql "$connection_string" -c "
        SELECT 
            pid,
            usename,
            mode,
            locktype,
            relation::regclass
        FROM pg_locks
        JOIN pg_stat_activity ON pid = pg_locks.pid
        WHERE NOT granted;
    " 2>/dev/null)
    
    if [[ -n "$locks" ]]; then
        log_warn "Database locks detected:\n$locks"
    else
        log_success "No database locks detected"
    fi
}

# 備份特定表
backup_specific_table() {
    local table_name="$1"
    local backup_dir="$2"
    
    log_info "Backing up table: $table_name"
    
    local connection_string=$(convert_supabase_url_to_psql "$NEXT_PUBLIC_SUPABASE_URL")
    local backup_file="$backup_dir/${table_name}_backup_${TIMESTAMP}.sql"
    
    if pg_dump "$connection_string" \
        --verbose \
        --clean \
        --create \
        --if-exists \
        --format=plain \
        --table="$table_name" \
        --file="$backup_file"; then
        
        log_success "Table backup created: $backup_file"
        
        # 壓縮備份文件
        gzip "$backup_file"
        log_success "Table backup compressed: ${backup_file}.gz"
        
        echo "${backup_file}.gz"
    else
        error_exit "Table backup failed: $table_name"
    fi
}

# 同步資料庫配置
sync_database_config() {
    log_info "Syncing database configuration..."
    
    local connection_string=$(convert_supabase_url_to_psql "$NEXT_PUBLIC_SUPABASE_URL")
    
    # 設置推薦的 PostgreSQL 配置
    psql "$connection_string" -c "
        -- 設置工作記憶體
        ALTER SYSTEM SET work_mem = '16MB';
        
        -- 設置共享緩衝區
        ALTER SYSTEM SET shared_buffers = '256MB';
        
        -- 設置有效緩存大小
        ALTER SYSTEM SET effective_cache_size = '1GB';
        
        -- 重載配置
        SELECT pg_reload_conf();
    " &>/dev/null
    
    log_success "Database configuration synced"
}

# 創建資料庫快照
create_database_snapshot() {
    local snapshot_name="$1"
    
    log_info "Creating database snapshot: $snapshot_name"
    
    local backup_dir=$(create_backup_directory)
    local snapshot_file="$backup_dir/snapshot_${snapshot_name}_${TIMESTAMP}.sql"
    
    create_database_backup > "$snapshot_file"
    
    log_success "Database snapshot created: $snapshot_file"
    echo "$snapshot_file"
}

# 恢復資料庫快照
restore_database_snapshot() {
    local snapshot_file="$1"
    
    log_info "Restoring database snapshot: $snapshot_file"
    
    if [[ ! -f "$snapshot_file" ]]; then
        error_exit "Snapshot file not found: $snapshot_file"
    fi
    
    restore_database_backup "$snapshot_file"
    
    log_success "Database snapshot restored"
}

# 監控資料庫性能
monitor_database_performance() {
    log_info "Monitoring database performance..."
    
    local connection_string=$(convert_supabase_url_to_psql "$NEXT_PUBLIC_SUPABASE_URL")
    
    # 監控慢查詢
    local slow_queries=$(psql "$connection_string" -c "
        SELECT 
            query,
            mean_time,
            calls,
            total_time
        FROM pg_stat_statements
        WHERE mean_time > 100
        ORDER BY mean_time DESC
        LIMIT 10;
    " 2>/dev/null)
    
    if [[ -n "$slow_queries" ]]; then
        log_warn "Slow queries detected:\n$slow_queries"
    fi
    
    # 監控資源使用
    local resource_usage=$(psql "$connection_string" -c "
        SELECT 
            datname,
            numbackends,
            xact_commit,
            xact_rollback,
            blks_read,
            blks_hit,
            tup_returned,
            tup_fetched
        FROM pg_stat_database
        WHERE datname = current_database();
    " 2>/dev/null)
    
    log_info "Database performance metrics:\n$resource_usage"
}

# 驗證資料完整性
verify_data_integrity() {
    log_info "Verifying data integrity..."
    
    local connection_string=$(convert_supabase_url_to_psql "$NEXT_PUBLIC_SUPABASE_URL")
    
    # 檢查外鍵約束
    local fk_violations=$(psql "$connection_string" -c "
        SELECT 
            conname,
            conrelid::regclass,
            confrelid::regclass
        FROM pg_constraint
        WHERE contype = 'f' AND NOT convalidated;
    " 2>/dev/null)
    
    if [[ -n "$fk_violations" ]]; then
        log_warn "Foreign key violations detected:\n$fk_violations"
    fi
    
    # 檢查檢查約束
    local check_violations=$(psql "$connection_string" -c "
        SELECT 
            conname,
            conrelid::regclass
        FROM pg_constraint
        WHERE contype = 'c' AND NOT convalidated;
    " 2>/dev/null)
    
    if [[ -n "$check_violations" ]]; then
        log_warn "Check constraint violations detected:\n$check_violations"
    fi
    
    log_success "Data integrity verification completed"
}
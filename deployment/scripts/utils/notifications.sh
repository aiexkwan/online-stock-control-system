#!/bin/bash

# =================================================================
# 通知系統工具函數
# 作者: DevOps Team
# 版本: 1.0.0
# 描述: 部署通知和告警系統
# =================================================================

# 通知配置
readonly NOTIFICATION_CONFIG="$CONFIG_DIR/notifications.json"
readonly WEBHOOK_TIMEOUT=10
readonly MAX_RETRY_ATTEMPTS=3

# 發送成功通知
send_success_notification() {
    local message="$1"
    local deployment_info="$2"
    
    log_info "Sending success notification..."
    
    local notification_data=$(create_notification_payload "success" "$message" "$deployment_info")
    
    # 發送到各個通知渠道
    send_to_slack "$notification_data" "success"
    send_to_email "$notification_data" "success"
    send_to_webhook "$notification_data" "success"
    send_to_teams "$notification_data" "success"
    
    log_success "Success notification sent"
}

# 發送失敗通知
send_failure_notification() {
    local message="$1"
    local deployment_info="$2"
    local error_details="$3"
    
    log_info "Sending failure notification..."
    
    local notification_data=$(create_notification_payload "failure" "$message" "$deployment_info" "$error_details")
    
    # 發送到各個通知渠道
    send_to_slack "$notification_data" "failure"
    send_to_email "$notification_data" "failure"
    send_to_webhook "$notification_data" "failure"
    send_to_teams "$notification_data" "failure"
    
    log_success "Failure notification sent"
}

# 發送警告通知
send_warning_notification() {
    local message="$1"
    local warning_details="$2"
    
    log_info "Sending warning notification..."
    
    local notification_data=$(create_notification_payload "warning" "$message" "" "$warning_details")
    
    # 發送到各個通知渠道
    send_to_slack "$notification_data" "warning"
    send_to_email "$notification_data" "warning"
    send_to_webhook "$notification_data" "warning"
    
    log_success "Warning notification sent"
}

# 創建通知載荷
create_notification_payload() {
    local status="$1"
    local message="$2"
    local deployment_info="$3"
    local details="$4"
    
    local git_info=$(get_git_info)
    local deployment_duration=$(calculate_duration)
    
    jq -n \
        --arg status "$status" \
        --arg message "$message" \
        --arg environment "$ENVIRONMENT" \
        --arg version "$VERSION" \
        --arg target_color "$TARGET_COLOR" \
        --arg deployment_type "$DEPLOY_TYPE" \
        --arg timestamp "$(date -u +%Y-%m-%dT%H:%M:%SZ)" \
        --arg duration "$deployment_duration" \
        --argjson git "$git_info" \
        --arg details "$details" \
        --arg deployment_info "$deployment_info" \
        '{
            status: $status,
            message: $message,
            environment: $environment,
            version: $version,
            target_color: $target_color,
            deployment_type: $deployment_type,
            timestamp: $timestamp,
            duration: $duration,
            git: $git,
            details: $details,
            deployment_info: $deployment_info,
            server: "$(hostname)",
            user: "$(whoami)"
        }'
}

# 發送到 Slack
send_to_slack() {
    local notification_data="$1"
    local status="$2"
    
    # 檢查 Slack 配置
    local slack_webhook=$(get_notification_config "slack.webhook_url")
    local slack_channel=$(get_notification_config "slack.channel")
    
    if [[ -z "$slack_webhook" ]] || [[ "$slack_webhook" == "null" ]]; then
        log_info "Slack webhook not configured, skipping Slack notification"
        return 0
    fi
    
    log_info "Sending Slack notification..."
    
    local color
    local emoji
    case "$status" in
        success)
            color="good"
            emoji=":white_check_mark:"
            ;;
        failure)
            color="danger"
            emoji=":x:"
            ;;
        warning)
            color="warning"
            emoji=":warning:"
            ;;
        *)
            color="good"
            emoji=":information_source:"
            ;;
    esac
    
    local message=$(echo "$notification_data" | jq -r '.message')
    local environment=$(echo "$notification_data" | jq -r '.environment')
    local version=$(echo "$notification_data" | jq -r '.version')
    local target_color=$(echo "$notification_data" | jq -r '.target_color')
    local duration=$(echo "$notification_data" | jq -r '.duration')
    local git_branch=$(echo "$notification_data" | jq -r '.git.branch')
    local git_commit=$(echo "$notification_data" | jq -r '.git.short_commit')
    
    local slack_payload=$(jq -n \
        --arg channel "$slack_channel" \
        --arg color "$color" \
        --arg emoji "$emoji" \
        --arg message "$message" \
        --arg environment "$environment" \
        --arg version "$version" \
        --arg target_color "$target_color" \
        --arg duration "$duration" \
        --arg git_branch "$git_branch" \
        --arg git_commit "$git_commit" \
        '{
            channel: $channel,
            username: "NewPennine Deployment Bot",
            icon_emoji: ":rocket:",
            attachments: [
                {
                    color: $color,
                    title: ($emoji + " Deployment " + ($environment | ascii_upcase)),
                    text: $message,
                    fields: [
                        {
                            title: "Environment",
                            value: $environment,
                            short: true
                        },
                        {
                            title: "Version",
                            value: $version,
                            short: true
                        },
                        {
                            title: "Target Color",
                            value: $target_color,
                            short: true
                        },
                        {
                            title: "Duration",
                            value: $duration,
                            short: true
                        },
                        {
                            title: "Git Branch",
                            value: $git_branch,
                            short: true
                        },
                        {
                            title: "Git Commit",
                            value: $git_commit,
                            short: true
                        }
                    ],
                    footer: "NewPennine WMS",
                    ts: (now | floor)
                }
            ]
        }')
    
    # 發送到 Slack
    if curl -X POST \
        -H "Content-Type: application/json" \
        -d "$slack_payload" \
        --max-time "$WEBHOOK_TIMEOUT" \
        "$slack_webhook" &>/dev/null; then
        log_success "Slack notification sent successfully"
    else
        log_warn "Failed to send Slack notification"
    fi
}

# 發送到 Microsoft Teams
send_to_teams() {
    local notification_data="$1"
    local status="$2"
    
    local teams_webhook=$(get_notification_config "teams.webhook_url")
    
    if [[ -z "$teams_webhook" ]] || [[ "$teams_webhook" == "null" ]]; then
        log_info "Teams webhook not configured, skipping Teams notification"
        return 0
    fi
    
    log_info "Sending Teams notification..."
    
    local theme_color
    case "$status" in
        success) theme_color="00FF00" ;;
        failure) theme_color="FF0000" ;;
        warning) theme_color="FFA500" ;;
        *) theme_color="0078D4" ;;
    esac
    
    local message=$(echo "$notification_data" | jq -r '.message')
    local environment=$(echo "$notification_data" | jq -r '.environment')
    local version=$(echo "$notification_data" | jq -r '.version')
    local target_color=$(echo "$notification_data" | jq -r '.target_color')
    local duration=$(echo "$notification_data" | jq -r '.duration')
    
    local teams_payload=$(jq -n \
        --arg theme_color "$theme_color" \
        --arg message "$message" \
        --arg environment "$environment" \
        --arg version "$version" \
        --arg target_color "$target_color" \
        --arg duration "$duration" \
        '{
            "@type": "MessageCard",
            "@context": "http://schema.org/extensions",
            themeColor: $theme_color,
            summary: ("NewPennine Deployment - " + ($environment | ascii_upcase)),
            sections: [
                {
                    activityTitle: ("NewPennine Deployment - " + ($environment | ascii_upcase)),
                    activitySubtitle: $message,
                    facts: [
                        {
                            name: "Environment",
                            value: $environment
                        },
                        {
                            name: "Version",
                            value: $version
                        },
                        {
                            name: "Target Color",
                            value: $target_color
                        },
                        {
                            name: "Duration",
                            value: $duration
                        }
                    ]
                }
            ]
        }')
    
    if curl -X POST \
        -H "Content-Type: application/json" \
        -d "$teams_payload" \
        --max-time "$WEBHOOK_TIMEOUT" \
        "$teams_webhook" &>/dev/null; then
        log_success "Teams notification sent successfully"
    else
        log_warn "Failed to send Teams notification"
    fi
}

# 發送郵件通知
send_to_email() {
    local notification_data="$1"
    local status="$2"
    
    local email_config=$(get_notification_config "email")
    local smtp_server=$(echo "$email_config" | jq -r '.smtp_server // empty')
    local smtp_port=$(echo "$email_config" | jq -r '.smtp_port // empty')
    local from_email=$(echo "$email_config" | jq -r '.from_email // empty')
    local to_emails=$(echo "$email_config" | jq -r '.to_emails[] // empty')
    local smtp_username=$(echo "$email_config" | jq -r '.smtp_username // empty')
    local smtp_password=$(echo "$email_config" | jq -r '.smtp_password // empty')
    
    if [[ -z "$smtp_server" ]] || [[ -z "$from_email" ]] || [[ -z "$to_emails" ]]; then
        log_info "Email configuration not complete, skipping email notification"
        return 0
    fi
    
    log_info "Sending email notification..."
    
    local subject
    local message=$(echo "$notification_data" | jq -r '.message')
    local environment=$(echo "$notification_data" | jq -r '.environment')
    local version=$(echo "$notification_data" | jq -r '.version')
    
    case "$status" in
        success)
            subject="✅ NewPennine Deployment Success - $environment v$version"
            ;;
        failure)
            subject="❌ NewPennine Deployment Failed - $environment v$version"
            ;;
        warning)
            subject="⚠️ NewPennine Deployment Warning - $environment v$version"
            ;;
        *)
            subject="ℹ️ NewPennine Deployment Notification - $environment v$version"
            ;;
    esac
    
    # 創建郵件內容
    local email_content=$(create_email_content "$notification_data" "$status")
    
    # 使用 sendmail 或 mutt 發送郵件
    if command -v sendmail &> /dev/null; then
        echo -e "To: $to_emails\nSubject: $subject\nContent-Type: text/html\n\n$email_content" | sendmail "$to_emails"
        log_success "Email notification sent successfully"
    elif command -v mutt &> /dev/null; then
        echo "$email_content" | mutt -e "set content_type=text/html" -s "$subject" "$to_emails"
        log_success "Email notification sent successfully"
    else
        log_warn "No email client available, skipping email notification"
    fi
}

# 創建郵件內容
create_email_content() {
    local notification_data="$1"
    local status="$2"
    
    local message=$(echo "$notification_data" | jq -r '.message')
    local environment=$(echo "$notification_data" | jq -r '.environment')
    local version=$(echo "$notification_data" | jq -r '.version')
    local target_color=$(echo "$notification_data" | jq -r '.target_color')
    local deployment_type=$(echo "$notification_data" | jq -r '.deployment_type')
    local duration=$(echo "$notification_data" | jq -r '.duration')
    local timestamp=$(echo "$notification_data" | jq -r '.timestamp')
    local git_branch=$(echo "$notification_data" | jq -r '.git.branch')
    local git_commit=$(echo "$notification_data" | jq -r '.git.commit')
    local git_author=$(echo "$notification_data" | jq -r '.git.author')
    
    local status_color
    case "$status" in
        success) status_color="#28a745" ;;
        failure) status_color="#dc3545" ;;
        warning) status_color="#ffc107" ;;
        *) status_color="#007bff" ;;
    esac
    
    cat << EOF
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>NewPennine Deployment Notification</title>
</head>
<body style="font-family: Arial, sans-serif; margin: 0; padding: 20px; background-color: #f8f9fa;">
    <div style="max-width: 600px; margin: 0 auto; background-color: white; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
        <div style="padding: 20px; border-bottom: 1px solid #e9ecef;">
            <h1 style="color: $status_color; margin: 0; font-size: 24px;">NewPennine WMS Deployment</h1>
            <p style="color: #6c757d; margin: 5px 0 0 0; font-size: 14px;">$timestamp</p>
        </div>
        
        <div style="padding: 20px;">
            <div style="background-color: #f8f9fa; padding: 15px; border-radius: 4px; margin-bottom: 20px;">
                <h2 style="color: $status_color; margin: 0 0 10px 0; font-size: 18px;">$message</h2>
            </div>
            
            <table style="width: 100%; border-collapse: collapse;">
                <tr>
                    <td style="padding: 8px; border-bottom: 1px solid #e9ecef; font-weight: bold; color: #495057;">Environment:</td>
                    <td style="padding: 8px; border-bottom: 1px solid #e9ecef; color: #6c757d;">$environment</td>
                </tr>
                <tr>
                    <td style="padding: 8px; border-bottom: 1px solid #e9ecef; font-weight: bold; color: #495057;">Version:</td>
                    <td style="padding: 8px; border-bottom: 1px solid #e9ecef; color: #6c757d;">$version</td>
                </tr>
                <tr>
                    <td style="padding: 8px; border-bottom: 1px solid #e9ecef; font-weight: bold; color: #495057;">Target Color:</td>
                    <td style="padding: 8px; border-bottom: 1px solid #e9ecef; color: #6c757d;">$target_color</td>
                </tr>
                <tr>
                    <td style="padding: 8px; border-bottom: 1px solid #e9ecef; font-weight: bold; color: #495057;">Deployment Type:</td>
                    <td style="padding: 8px; border-bottom: 1px solid #e9ecef; color: #6c757d;">$deployment_type</td>
                </tr>
                <tr>
                    <td style="padding: 8px; border-bottom: 1px solid #e9ecef; font-weight: bold; color: #495057;">Duration:</td>
                    <td style="padding: 8px; border-bottom: 1px solid #e9ecef; color: #6c757d;">$duration</td>
                </tr>
                <tr>
                    <td style="padding: 8px; border-bottom: 1px solid #e9ecef; font-weight: bold; color: #495057;">Git Branch:</td>
                    <td style="padding: 8px; border-bottom: 1px solid #e9ecef; color: #6c757d;">$git_branch</td>
                </tr>
                <tr>
                    <td style="padding: 8px; border-bottom: 1px solid #e9ecef; font-weight: bold; color: #495057;">Git Commit:</td>
                    <td style="padding: 8px; border-bottom: 1px solid #e9ecef; color: #6c757d;">$git_commit</td>
                </tr>
                <tr>
                    <td style="padding: 8px; font-weight: bold; color: #495057;">Author:</td>
                    <td style="padding: 8px; color: #6c757d;">$git_author</td>
                </tr>
            </table>
        </div>
        
        <div style="padding: 20px; background-color: #f8f9fa; border-top: 1px solid #e9ecef; text-align: center;">
            <p style="color: #6c757d; margin: 0; font-size: 12px;">
                NewPennine WMS Automated Deployment System<br>
                Generated at $(date)
            </p>
        </div>
    </div>
</body>
</html>
EOF
}

# 發送到 Webhook
send_to_webhook() {
    local notification_data="$1"
    local status="$2"
    
    local webhook_url=$(get_notification_config "webhook.url")
    local webhook_secret=$(get_notification_config "webhook.secret")
    
    if [[ -z "$webhook_url" ]] || [[ "$webhook_url" == "null" ]]; then
        log_info "Webhook URL not configured, skipping webhook notification"
        return 0
    fi
    
    log_info "Sending webhook notification..."
    
    local headers=("-H" "Content-Type: application/json")
    
    if [[ -n "$webhook_secret" ]] && [[ "$webhook_secret" != "null" ]]; then
        headers+=("-H" "Authorization: Bearer $webhook_secret")
    fi
    
    # 添加署名
    local signature=$(echo -n "$notification_data" | openssl dgst -sha256 -hmac "$webhook_secret" -binary | base64)
    headers+=("-H" "X-Signature: sha256=$signature")
    
    if curl -X POST \
        "${headers[@]}" \
        -d "$notification_data" \
        --max-time "$WEBHOOK_TIMEOUT" \
        "$webhook_url" &>/dev/null; then
        log_success "Webhook notification sent successfully"
    else
        log_warn "Failed to send webhook notification"
    fi
}

# 獲取通知配置
get_notification_config() {
    local config_path="$1"
    
    if [[ -f "$NOTIFICATION_CONFIG" ]]; then
        jq -r ".$config_path // empty" "$NOTIFICATION_CONFIG" 2>/dev/null
    else
        echo ""
    fi
}

# 創建通知配置文件
create_notification_config() {
    local config_dir=$(dirname "$NOTIFICATION_CONFIG")
    mkdir -p "$config_dir"
    
    log_info "Creating notification configuration template..."
    
    cat > "$NOTIFICATION_CONFIG" << EOF
{
    "slack": {
        "webhook_url": "",
        "channel": "#deployments",
        "username": "NewPennine Deployment Bot"
    },
    "teams": {
        "webhook_url": ""
    },
    "email": {
        "smtp_server": "",
        "smtp_port": 587,
        "from_email": "",
        "to_emails": [],
        "smtp_username": "",
        "smtp_password": ""
    },
    "webhook": {
        "url": "",
        "secret": ""
    },
    "settings": {
        "timeout": 10,
        "retry_attempts": 3,
        "enable_success_notifications": true,
        "enable_failure_notifications": true,
        "enable_warning_notifications": true
    }
}
EOF
    
    log_success "Notification configuration template created: $NOTIFICATION_CONFIG"
    log_info "Please edit the configuration file to add your notification settings"
}

# 測試通知配置
test_notification_config() {
    log_info "Testing notification configuration..."
    
    if [[ ! -f "$NOTIFICATION_CONFIG" ]]; then
        log_warn "Notification configuration file not found: $NOTIFICATION_CONFIG"
        return 1
    fi
    
    # 測試 JSON 格式
    if ! jq empty "$NOTIFICATION_CONFIG" &>/dev/null; then
        log_error "Invalid JSON in notification configuration"
        return 1
    fi
    
    # 發送測試通知
    local test_data=$(jq -n \
        --arg message "Test notification from NewPennine deployment system" \
        --arg environment "test" \
        --arg version "test" \
        --arg target_color "test" \
        --arg deployment_type "test" \
        --arg timestamp "$(date -u +%Y-%m-%dT%H:%M:%SZ)" \
        --arg duration "0s" \
        '{
            status: "test",
            message: $message,
            environment: $environment,
            version: $version,
            target_color: $target_color,
            deployment_type: $deployment_type,
            timestamp: $timestamp,
            duration: $duration
        }')
    
    send_to_slack "$test_data" "success"
    send_to_teams "$test_data" "success"
    send_to_email "$test_data" "success"
    send_to_webhook "$test_data" "success"
    
    log_success "Test notifications sent"
}

# 發送部署開始通知
send_deployment_start_notification() {
    local message="Deployment started for $ENVIRONMENT v$VERSION"
    local deployment_info="Starting deployment to $TARGET_COLOR environment"
    
    log_info "Sending deployment start notification..."
    
    local notification_data=$(create_notification_payload "info" "$message" "$deployment_info")
    
    send_to_slack "$notification_data" "info"
    send_to_teams "$notification_data" "info"
    send_to_webhook "$notification_data" "info"
    
    log_success "Deployment start notification sent"
}

# 發送部署進度通知
send_deployment_progress_notification() {
    local step="$1"
    local message="$2"
    
    log_info "Sending deployment progress notification: $step"
    
    local notification_data=$(create_notification_payload "progress" "$message" "Step: $step")
    
    # 只發送到 webhook 以避免過多通知
    send_to_webhook "$notification_data" "progress"
    
    log_success "Deployment progress notification sent"
}

# 獲取通知統計
get_notification_stats() {
    local stats_file="$LOGS_DIR/notification_stats.json"
    
    if [[ -f "$stats_file" ]]; then
        cat "$stats_file"
    else
        echo '{"sent": 0, "failed": 0, "success": 0, "failure": 0, "warning": 0}'
    fi
}

# 更新通知統計
update_notification_stats() {
    local status="$1"
    local result="$2"  # sent/failed
    
    local stats_file="$LOGS_DIR/notification_stats.json"
    local current_stats=$(get_notification_stats)
    
    local updated_stats=$(echo "$current_stats" | jq \
        --arg status "$status" \
        --arg result "$result" \
        '.[$result] += 1 | .[$status] += 1')
    
    echo "$updated_stats" > "$stats_file"
}
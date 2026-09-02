#!/usr/bin/env bash
set -euo pipefail

CONFIG_FILE="${CONFIG_FILE:-/etc/default/transconnect-ssl-monitor}"
[[ -r "$CONFIG_FILE" ]] && . "$CONFIG_FILE"

DOMAINS="${DOMAINS:-transconnect.app www.transconnect.app api.transconnect.app admin.transconnect.app}"
WARN_DAYS="${WARN_DAYS:-30}"
ALERT_URL="${ALERT_URL:-}"
STATE_FILE="${STATE_FILE:-/var/lib/transconnect/ssl-monitor.state}"

mkdir -p "$(dirname "$STATE_FILE")"
now=$(date +%s)
failures=()
details=()

for domain in $DOMAINS; do
    certificate=$(timeout 15 openssl s_client -connect "$domain:443" -servername "$domain" </dev/null 2>/dev/null \
        | openssl x509 -noout -enddate 2>/dev/null || true)
    expiry=${certificate#notAfter=}
    expiry_epoch=$(date -d "$expiry" +%s 2>/dev/null || echo 0)

    if [[ -z "$expiry" || "$expiry_epoch" -le 0 ]]; then
        failures+=("$domain: unable to read the certificate")
        continue
    fi

    remaining_days=$(( (expiry_epoch - now) / 86400 ))
    details+=("$domain: $expiry ($remaining_days days remaining)")
    if (( remaining_days < WARN_DAYS )); then
        failures+=("$domain: expires in $remaining_days days ($expiry)")
    fi
done

if (( ${#failures[@]} > 0 )); then
    status="warning"
    message="TransConnect SSL monitor warning\n\n${failures[*]}\n\nCertificate details:\n${details[*]}"
else
    status="ok"
    message="TransConnect SSL monitor recovered\n\nCertificate details:\n${details[*]}"
fi

previous_status=""
[[ -r "$STATE_FILE" ]] && previous_status=$(<"$STATE_FILE")

if [[ "$status" == "warning" && "$previous_status" != "warning" && -n "$ALERT_URL" ]] || \
    [[ "$status" == "ok" && "$previous_status" == "warning" && -n "$ALERT_URL" ]]; then
    curl --fail --silent --show-error --max-time 15 \
        -H 'Content-Type: text/plain' --data-binary "$message" "$ALERT_URL"
fi

printf '%s' "$status" > "$STATE_FILE"
if [[ "$status" == "warning" ]]; then
    printf '%s\n' "${failures[@]}" >&2
    exit 1
fi
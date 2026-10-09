"""Yandex Cloud Function: receive a landing request and notify Anastasia in Telegram."""
import json
import os
import urllib.error
import urllib.request

ALLOWED_ORIGIN = 'https://anastasiamedvedeva.ru'
MAX_BODY_BYTES = 4096


def response(status, data, origin=None):
    headers = {'Content-Type': 'application/json; charset=utf-8',
               'Cache-Control': 'no-store'}
    if origin == ALLOWED_ORIGIN:
        headers.update({'Access-Control-Allow-Origin': origin,
                        'Access-Control-Allow-Methods': 'POST, OPTIONS',
                        'Access-Control-Allow-Headers': 'Content-Type',
                        'Vary': 'Origin'})
    return {'statusCode': status, 'headers': headers,
            'body': json.dumps(data, ensure_ascii=False)}


def clean(value, limit):
    if not isinstance(value, str):
        return ''
    return ' '.join(value.strip().split())[:limit]


def handler(event, context):
    headers = {k.lower(): v for k, v in (event.get('headers') or {}).items()}
    origin = headers.get('origin')
    method = event.get('httpMethod', '').upper()
    if method == 'OPTIONS':
        return response(204, {}, origin)
    if method != 'POST':
        return response(405, {'error': 'method_not_allowed'}, origin)
    if origin != ALLOWED_ORIGIN:
        return response(403, {'error': 'origin_not_allowed'})
    if 'application/json' not in headers.get('content-type', ''):
        return response(415, {'error': 'unsupported_media_type'}, origin)

    raw = event.get('body') or ''
    if not isinstance(raw, str) or len(raw.encode('utf-8')) > MAX_BODY_BYTES:
        return response(413, {'error': 'body_too_large'}, origin)
    try:
        data = json.loads(raw)
    except (TypeError, ValueError):
        return response(400, {'error': 'invalid_json'}, origin)
    if not isinstance(data, dict):
        return response(400, {'error': 'invalid_payload'}, origin)
    if data.get('company'):
        return response(200, {'ok': True}, origin)

    name = clean(data.get('name'), 80)
    contact = clean(data.get('contact'), 160)
    message = clean(data.get('message'), 500)
    if not name or not contact or data.get('consent') is not True:
        return response(400, {'error': 'missing_required_fields'}, origin)
    if data.get('source') != 'trevoga':
        return response(400, {'error': 'invalid_source'}, origin)

    token = os.environ.get('TELEGRAM_BOT_TOKEN')
    chat_id = os.environ.get('TELEGRAM_CHAT_ID')
    if not token or not chat_id:
        return response(503, {'error': 'service_unavailable'}, origin)

    text = '\n'.join([
        'Новая заявка · программа «Тревога»',
        f'Имя: {name}',
        f'Контакт: {contact}',
        f'Запрос: {message or "не указан"}',
    ])
    request = urllib.request.Request(
        f'https://api.telegram.org/bot{token}/sendMessage',
        data=json.dumps({'chat_id': chat_id, 'text': text}, ensure_ascii=False).encode('utf-8'),
        headers={'Content-Type': 'application/json; charset=utf-8'},
        method='POST',
    )
    try:
        with urllib.request.urlopen(request, timeout=8) as telegram_response:
            result = json.load(telegram_response)
            if not result.get('ok'):
                return response(502, {'error': 'delivery_failed'}, origin)
    except (urllib.error.URLError, ValueError, TimeoutError):
        return response(502, {'error': 'delivery_failed'}, origin)
    return response(200, {'ok': True}, origin)

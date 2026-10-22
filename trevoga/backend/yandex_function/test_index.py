import json
import os
import unittest
from unittest.mock import patch
import index

ORIGIN = 'https://anastasiamedvedeva.ru'


def event(payload, origin=ORIGIN):
    return {'httpMethod': 'POST', 'headers': {'Origin': origin, 'Content-Type': 'application/json'},
            'body': json.dumps(payload, ensure_ascii=False)}


class HandlerTests(unittest.TestCase):
    def setUp(self):
        self.payload = {'name': 'Тест', 'surname': 'Тестова', 'phone': '+7 985 885-21-91',
                        'contactMethod': 'whatsapp', 'telegram': '', 'message': '',
                        'consent': True, 'company': '', 'source': 'trevoga'}

    def test_rejects_other_origin(self):
        self.assertEqual(index.handler(event(self.payload, 'https://other.example'), None)['statusCode'], 403)

    def test_validates_consent(self):
        self.payload['consent'] = False
        self.assertEqual(index.handler(event(self.payload), None)['statusCode'], 400)

    def test_honeypot_does_not_send(self):
        self.payload['company'] = 'spam'
        self.assertEqual(index.handler(event(self.payload), None)['statusCode'], 200)

    def test_rejects_invalid_phone(self):
        self.payload['phone'] = 'abc'
        self.assertEqual(index.handler(event(self.payload), None)['statusCode'], 400)

    def test_requires_telegram_username_when_selected(self):
        self.payload['contactMethod'] = 'telegram'
        self.assertEqual(index.handler(event(self.payload), None)['statusCode'], 400)

    @patch.dict(os.environ, {'YANDEX_MAIL_APP_PASSWORD': 'test-password'})
    @patch('index.smtplib.SMTP_SSL')
    def test_sends_valid_request(self, smtp_ssl):
        self.assertEqual(index.handler(event(self.payload), None)['statusCode'], 200)
        smtp = smtp_ssl.return_value.__enter__.return_value
        smtp.login.assert_called_once_with('fly.medvedeva@yandex.ru', 'test-password')
        letter = smtp.send_message.call_args.args[0]
        self.assertEqual(letter['To'], 'fly.medvedeva@yandex.ru')
        self.assertIn('Тест', letter.get_content())
        self.assertIn('WhatsApp', letter.get_content())


if __name__ == '__main__':
    unittest.main()

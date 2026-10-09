import io
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
        self.payload = {'name': 'Тест', 'contact': '@test', 'message': '',
                        'consent': True, 'company': '', 'source': 'trevoga'}

    def test_rejects_other_origin(self):
        self.assertEqual(index.handler(event(self.payload, 'https://other.example'), None)['statusCode'], 403)

    def test_validates_consent(self):
        self.payload['consent'] = False
        self.assertEqual(index.handler(event(self.payload), None)['statusCode'], 400)

    def test_honeypot_does_not_send(self):
        self.payload['company'] = 'spam'
        self.assertEqual(index.handler(event(self.payload), None)['statusCode'], 200)

    @patch.dict(os.environ, {'TELEGRAM_BOT_TOKEN': 'test-token', 'TELEGRAM_CHAT_ID': '123'})
    @patch('index.urllib.request.urlopen')
    def test_sends_valid_request(self, urlopen):
        urlopen.return_value.__enter__.return_value = io.BytesIO(b'{"ok":true}')
        self.assertEqual(index.handler(event(self.payload), None)['statusCode'], 200)
        request = urlopen.call_args.args[0]
        self.assertIn('/sendMessage', request.full_url)
        self.assertIn('Тест', request.data.decode('utf-8'))


if __name__ == '__main__':
    unittest.main()

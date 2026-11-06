"""Focused tests for the Python backend using Python's built-in test runner."""

import json
import unittest

from fastapi.testclient import TestClient

from app import app, registrations


class TrainingAPITests(unittest.TestCase):
    def setUp(self):
        registrations.clear()
        self.client = TestClient(app)
        self.addCleanup(self.client.close)
        self.valid = {
            "name": "Demo Learner",
            "email": "learner@example.com",
            "topicId": "copilot-fundamentals",
        }

    def test_frontend_and_static_files(self):
        for path, content_type in [
            ("/", "text/html"),
            ("/app.js", "text/javascript"),
            ("/styles.css", "text/css"),
            ("/static/index.html", "text/html"),
        ]:
            with self.subTest(path=path):
                response = self.client.get(path)
                self.assertEqual(response.status_code, 200)
                self.assertTrue(response.headers["content-type"].startswith(content_type))
                self.assertEqual(response.headers["x-content-type-options"], "nosniff")
                self.assertIn("frame-ancestors 'none'", response.headers["content-security-policy"])
        self.assertIn("GH-300 training", self.client.get("/").text)

    def test_topics_have_frontend_fields(self):
        response = self.client.get("/api/topics")
        self.assertEqual(response.status_code, 200)
        topics = response.json()
        self.assertEqual(len(topics), 6)
        self.assertEqual(len({topic["id"] for topic in topics}), len(topics))
        for topic in topics:
            for field in ("id", "title", "description", "duration"):
                self.assertIsInstance(topic[field], str)
                self.assertTrue(topic[field])
            self.assertNotIn("participants", topic)
            self.assertEqual(topic["capacity"], 30)
            self.assertEqual(topic["registrationCount"], 0)

    def test_topic_registration_counts_are_display_only(self):
        for index in range(31):
            response = self.client.post("/api/registrations", json={
                **self.valid, "email": f"learner{index}@example.com",
            })
            self.assertEqual(response.status_code, 201)
        response = self.client.post("/api/registrations", json={
            **self.valid, "topicId": "effective-prompts",
        })
        self.assertEqual(response.status_code, 201)

        response = self.client.get("/api/topics")
        self.assertEqual(response.status_code, 200)
        for topic in response.json():
            expected = {
                "copilot-fundamentals": 31,
                "effective-prompts": 1,
            }.get(topic["id"], 0)
            self.assertEqual(topic["registrationCount"], expected)
            self.assertEqual(topic["capacity"], 30)
            self.assertEqual(set(topic), {
                "id", "title", "description", "duration", "capacity", "registrationCount",
            })
        self.assertNotIn("learner@example.com", response.text)

        registrations.clear()
        self.assertTrue(all(
            topic["registrationCount"] == 0
            for topic in self.client.get("/api/topics").json()
        ))

    def test_register_normalize_and_prevent_duplicates(self):
        response = self.client.post("/api/registrations", json={
            **self.valid, "name": " Demo Learner ", "email": " Learner@Example.com ",
        })
        self.assertEqual(response.status_code, 201)
        result = response.json()
        self.assertEqual(result["registration"]["name"], self.valid["name"])
        self.assertEqual(result["registration"]["email"], self.valid["email"])
        self.assertTrue(result["registration"]["id"])
        self.assertIn("GitHub Copilot fundamentals", result["message"])
        self.assertEqual(self.client.post("/api/registrations", json=self.valid).status_code, 409)
        response = self.client.post("/api/registrations", json={
            **self.valid, "topicId": "effective-prompts",
        })
        self.assertEqual(response.status_code, 201)

    def test_invalid_registration_fields(self):
        for invalid in [
            None, [], {}, {**self.valid, "name": " "}, {**self.valid, "name": 123},
            {**self.valid, "name": "a" * 101}, {**self.valid, "email": "invalid"},
            {**self.valid, "email": "a" * 250 + "@example.com"},
            {**self.valid, "email": []}, {**self.valid, "topicId": "unknown"},
            {**self.valid, "topicId": {}},
        ]:
            with self.subTest(data=invalid):
                response = self.client.post(
                    "/api/registrations",
                    content=json.dumps(invalid),
                    headers={"Content-Type": "application/json"},
                )
                self.assertEqual(response.status_code, 400)
                self.assertIsInstance(response.json()["error"], str)
        self.assertFalse(registrations)

    def test_malformed_oversized_and_non_json_requests(self):
        for body, content_type, expected in [
            ("{", "application/json", 400),
            (b"\xff", "application/json", 400),
            ('{"name":"' + "a" * 9000 + '"}', "application/json", 413),
            ("{}", "text/plain", 415),
        ]:
            with self.subTest(expected=expected, body=str(body)[:20]):
                response = self.client.post(
                    "/api/registrations", content=body, headers={"Content-Type": content_type},
                )
                self.assertEqual(response.status_code, expected)
                self.assertIn("error", response.json())

    def test_private_data_and_source_are_not_exposed(self):
        for path in (
            "/api/registrations", "/app.py", "/server.js", "/topics.json",
            "/static/../app.py", "/static/%2e%2e/app.py",
        ):
            with self.subTest(path=path):
                self.assertIn(self.client.get(path).status_code, (404, 405))

    def test_api_documentation(self):
        self.assertEqual(self.client.get("/docs").status_code, 200)
        schema = self.client.get("/openapi.json").json()
        self.assertIn("/api/topics", schema["paths"])
        self.assertIn("/api/registrations", schema["paths"])
        body = schema["paths"]["/api/registrations"]["post"]["requestBody"]
        fields = body["content"]["application/json"]["schema"]["properties"]
        response = self.client.post("/api/registrations", json={
            key: field["example"] for key, field in fields.items()
        })
        self.assertEqual(response.status_code, 201)


if __name__ == "__main__":
    unittest.main()

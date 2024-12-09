import unittest
from selenium import webdriver
from selenium.webdriver.common.keys import Keys
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
import requests
import os
import time

class TestNavigation(unittest.TestCase):

    def setUp(self):
        self.driver = webdriver.Firefox()
        self.driver.get("http://localhost:8000")
        self.email = os.getenv("TEST_EMAIL")
        self.password = os.getenv("TEST_PASSWORD")
        self.driver.refresh()
    
    def test_dashboard(self):
        driver = self.driver
        assert driver.title == "Tech Radar Data Collection"

        time.sleep(1)
    
    def test_project_nav(self):
        driver = self.driver
        driver.find_element(By.ID, "tab_add-projects").click()
        assert driver.current_url == "http://localhost:8000/dashboard#add-projects"

        driver.find_element(By.ID, "add-project").click()
        assert driver.current_url == "http://localhost:8000/pre-survey"

        button = driver.find_element("link text", "Continue")

        driver.execute_script("arguments[0].scrollIntoView(true);", button)

        button.click()
        assert driver.current_url == "http://localhost:8000/survey"

        time.sleep(1)

    def tearDown(self):
        self.driver.close()

if __name__ == "__main__":
    unittest.main()
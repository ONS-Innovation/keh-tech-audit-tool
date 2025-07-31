import os
import time
import unittest

from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from test_utils import TestUtil


class TestNavigation(unittest.TestCase, TestUtil):

    def setUp(self):
        """Set up testing"""
        if os.getenv("CLIENT").lower() == "chrome":
            self.driver = webdriver.Chrome()
        else:
            self.driver = webdriver.Firefox()
        self.driver.get("http://localhost:8000")
        self.email = os.getenv("TEST_EMAIL")
        self.password = os.getenv("TEST_PASSWORD")
        self.wait = WebDriverWait(self.driver, 5)
        self.driver.refresh()

    def test_dashboard(self):
        """Test if dashboard contents are correct"""
        driver = self.driver
        self.login(driver)
        self.driver.get("http://localhost:8000")
        assert driver.title == "Tech Radar Data Collection"

        time.sleep(1)

    def test_project_nav(self):
        """Test if project navigation is correct"""
        driver = self.driver
        self.login(driver)
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

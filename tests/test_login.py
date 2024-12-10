import unittest
from selenium import webdriver
from selenium.webdriver.common.keys import Keys
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.common.exceptions import TimeoutException
import requests
import os
import time
import pickle
import pathlib

class TestNavigation(unittest.TestCase):
    def setUp(self):
        """Set up testing"""
        self.driver = webdriver.Firefox()
        self.driver.maximize_window()
        self.email = os.getenv("TEST_EMAIL")
        self.password = os.getenv("TEST_PASSWORD")
        self.cookie_file = "cookies.pkl"
        
    def tearDown(self):
        """End all testing processes"""
        self.driver.quit()
        
    def save_cookies(self):
        """Saves session cookies to a file post-login from Cognito"""
        # Create cookies directory if it doesn't exist
        pathlib.Path("cookies").mkdir(exist_ok=True)
        with open(f"cookies/{self.cookie_file}", "wb") as f:
            pickle.dump(self.driver.get_cookies(), f)
            
    def load_cookies(self):
        """Load cookies into session if they exist"""
        try:
            with open(f"cookies/{self.cookie_file}", "rb") as f:
                cookies = pickle.load(f)
                for cookie in cookies:
                    self.driver.add_cookie(cookie)
                return True
        except FileNotFoundError:
            return False
            
    def is_login_successful(self):
        """Returns True if the user is successfully logged in"""
        self.driver.get("http://localhost:8000/dashboard")
        time.sleep(1)
        
        return "/dashboard" in self.driver.current_url
        
    def test_login_flow(self):
        """Test general login flow starting from the index page"""
        self.driver.get("http://localhost:8000")
        
        if self.load_cookies():
            print("Found existing cookies, attempting to use them...")
            self.driver.refresh()
            
            if self.is_login_successful():
                print("Successfully logged in with existing cookies!")
                return
            else:
                print("Cookies expired, proceeding with login...")
            
        wait = WebDriverWait(self.driver, 3)
        
        cognito_link = wait.until(
            EC.element_to_be_clickable((By.XPATH, "//a[contains(.,'Sign in with Cognito')]"))
        )
        cognito_link.click()
        
        visible_form = wait.until(
            EC.visibility_of_element_located((By.XPATH, "//div[contains(@class,'visible-md')]//form[@name='cognitoSignInForm']"))
        )
        
        username_field = visible_form.find_element(By.NAME, "username")
        username_field.send_keys(self.email)
        
        password_field = visible_form.find_element(By.NAME, "password")
        password_field.send_keys(self.password)
        
        submit_button = visible_form.find_element(By.NAME, "signInSubmitButton")
        submit_button.click()
        
        time.sleep(2)
        
        if self.is_login_successful():
            print("Login successful, saving cookies...")
            self.save_cookies()
        else:
            raise Exception("Login failed - could not access dashboard")

if __name__ == "__main__":
    unittest.main()
import unittest
from selenium import webdriver
from selenium.webdriver.common.keys import Keys
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
import requests

class TestSignIn(unittest.TestCase):

    def setUp(self):
        self.driver = webdriver.Firefox()
    
    def test_sign_in(self):
        driver = self.driver
        driver.get("http://localhost:8000/")
        button = driver.find_element("link text", "Sign in with Cognito").click()
        # WebDriverWait(driver, 1000000).until(EC.element_to_be_clickable((By.XPATH, '/html/body/'))).click()
        text = driver.find_element(By.CLASS_NAME, "").text
        print(text)
        assert text == "Sign in with your email and password"
        
    def tearDown(self):
        self.driver.close()

if __name__ == "__main__":
    unittest.main()
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
import random

class TestUtil:
    def click_link(self, driver, link_text):
        """Click link via text"""
        driver.implicitly_wait(10)
        link = driver.find_element(By.LINK_TEXT, link_text)
        driver.execute_script("window.scrollTo(0, document.body.scrollHeight);")
        self.wait.until(EC.element_to_be_clickable(link)).click()
        driver.implicitly_wait(10)
    
    def click_radio(self, driver, options):
        """Randomly choose option from radio"""
        choice = random.choice(options)
        driver.implicitly_wait(10)
        radio = driver.find_element(By.ID, choice)
        self.wait.until(EC.element_to_be_clickable(radio)).click()
        return choice
    
    def login(self, driver):
        """Sign in with Cognito"""
        self.click_link(driver, "Sign in with Cognito")

        form = self.wait.until(
            EC.visibility_of_element_located((By.XPATH, "//div[contains(@class,'visible-md')]//form[@name='cognitoSignInForm']"))
        )

        email = form.find_element(By.NAME, "username")
        password = form.find_element(By.NAME, "password")
        email.send_keys(self.email)
        password.send_keys(self.password)
        button = form.find_element(By.NAME, "signInSubmitButton")
        self.wait.until(EC.element_to_be_clickable(button)).click()

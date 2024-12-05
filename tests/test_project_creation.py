import unittest
from selenium import webdriver
from selenium.webdriver.common.keys import Keys
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
import requests
import os
import random
import time

def click_link(driver, link_text):
    link = driver.find_element(By.LINK_TEXT, link_text)
    driver.execute_script("window.scrollTo(0, document.body.scrollHeight);")
    link.click()
    driver.implicitly_wait(10)

def click_radio(driver, options):
    choice = random.choice(options)
    radio = driver.find_element(By.ID, choice)
    radio.click()
    return choice

class TestProjectCreation(unittest.TestCase):

    def setUp(self):
        self.driver = webdriver.Firefox()
        id_token = os.getenv("id_token")
        self.driver.get("http://localhost:8000/survey")
        self.driver.add_cookie({"name": "session", "value": id_token})
        self.driver.refresh()
    

    def test_project_details(self):
        driver = self.driver

        link = driver.find_elements(By.CLASS_NAME, "ons-summary__button")[0]
        print(link.text)
        link.click()
        
        driver.implicitly_wait(10)
        link = driver.find_element(By.LINK_TEXT, "Continue")
        link.click()
        
        driver.implicitly_wait(10)
        email = driver.find_element(By.ID, "contact-email")
        email.click()
        email.send_keys("test@ons.gov.uk")

        choice = click_radio(driver,  ['Grade 6', "Grade 7", "SEO", "HEO", "other"])

        if choice == "other":
            other_input = driver.find_element(By.ID, "other-input")
            other_input.click()
            other_input.send_keys("Example Role")
        
        
        click_link(driver, "Save and continue")
       
        email = driver.find_element(By.ID, "contact-email")
        email.click()
        email.send_keys("testmanager@ons.gov.uk")

        choice = click_radio(driver, ['Grade 6', "Grade 7", "SEO", "HEO", "other"])

        if choice == "other":
            other_input = driver.find_element(By.ID, "other-input")
            other_input.click()
            other_input.send_keys("Example Role")
        
        click_link(driver, "Save and continue")
        
        project_name = driver.find_element(By.ID, "project-name")
        project_short_name = driver.find_element(By.ID, "project-short-name")
        documentation_link = driver.find_element(By.ID, "documentation-link")
        project_description = driver.find_element(By.ID, "project-description")

        project_name.click()
        project_name.send_keys("Selenium bot test")
        project_short_name.click()
        project_short_name.send_keys("selbottest")
        documentation_link.click()
        documentation_link.send_keys("https://example.com")
        project_description.click()
        project_description.send_keys("test description")

        click_link(driver, "Save and continue")

        choice = click_radio(driver, ["outsourced", "partnership"])

        if choice == "partnership":
            driver.execute_script("window.scrollTo(0, document.body.scrollHeight);")
            company_name = driver.find_element(By.ID, "other-input-2")
            company_name.click()
            company_name.clear()
            company_name.send_keys("Example Company")
        elif choice == "outsourced":
            driver.execute_script("window.scrollTo(0, document.body.scrollHeight);")
            company_name = driver.find_element(By.ID, "other-input-1")
            company_name.click()
            company_name.clear()
            company_name.send_keys("Example Company")
        click_link(driver, "Save and continue")

        click_radio(driver, ["Development", "Active Support", "Unsupported"])

        click_link(driver, "Save and continue")

        click_link(driver, "Finish section")

        time.sleep(2)
    
    def tearDown(self):
        self.driver.close()


if __name__ == "__main__":
    unittest.main()

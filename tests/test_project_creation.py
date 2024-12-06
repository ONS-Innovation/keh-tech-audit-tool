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

class TestProjectCreation(unittest.TestCase):

    def setUp(self):
        self.driver = webdriver.Firefox()
        id_token = os.getenv("id_token")
        self.driver.get("http://localhost:8000/survey")
        self.driver.add_cookie({"name": "session", "value": id_token})
        self.driver.refresh()

    def test_project_details(self):
        driver = self.driver

        complete_contact_details(driver)

        complete_project_details(driver)

        complete_tools_details(driver)

        driver.implicitly_wait(10)

        link = driver.find_elements(By.CLASS_NAME, "ons-summary__button")[1]

        link.click()

        driver.implicitly_wait(10)

        click_link(driver, "Continue")

        complete_source_control(driver)

        complete_hosting(driver)

        complete_database(driver)

        link = driver.find_elements(By.CLASS_NAME, "ons-summary__button")[2]

        link.click()

        click_link(driver, "Continue")

        complete_languages(driver)
        
        complete_frameworks(driver)

        complete_integrations(driver)

        complete_infrastructure(driver)

        click_link(driver, "Continue to Submission")

        button = driver.find_element(By.ID, 'submit-button')
        driver.execute_script("window.scrollTo(0, document.body.scrollHeight);")
        button.click()
        time.sleep(10)

    
    def tearDown(self):
        self.driver.close()

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

def complete_contact_details(driver):
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
    
def complete_project_details(driver):
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

def complete_tools_details(driver):
        choice = click_radio(driver, ["in-house", "outsourced", "partnership"])

        if choice == "partnership":
            company_name = driver.find_element(By.ID, "other-input-2")
            company_name.click()
            company_name.send_keys("Example Company")
        elif choice == "outsourced":
            company_name = driver.find_element(By.ID, "other-input-1")
            company_name.click()
            company_name.send_keys("Example Company")

        click_link(driver, "Save and continue")

        click_radio(driver, ["Development", "Active Support", "Unsupported"])

        click_link(driver, "Save and continue")

        click_link(driver, "Finish section")

def complete_source_control(driver):
        choice = click_radio(driver, ["github", "gitlab", "other"])

        if choice == "other":
            source_control = driver.find_element(By.ID, "other-input")
            source_control.click()
            source_control.send_keys("Bitbucket")
        
        click_link(driver, "Save and continue")

        source_control_link = driver.find_element(By.ID, "source_control_link-input")
        source_control_link.click()
        source_control_link.send_keys("https://example.com")
        
        source_control_description = driver.find_element(By.ID, "source_control_desc-input")
        source_control_description.click()
        source_control_description.send_keys("Test Description")

        # add_btn = driver.find_elements(By.CLASS_NAME, "ons-btn")[0]
        add_btn = driver.find_element(By.XPATH, '//button[@class="ons-btn ons-search__btn ons-btn--small"]')
        add_btn.click()
        click_link(driver, "Save and continue")

def complete_hosting(driver):
        click_radio(driver, ["On-premises", "Cloud", "Hybrid"])
        click_link(driver, "Save and continue")

        hosting_provider = driver.find_element(By.ID, "hosting-input")
        driver.implicitly_wait(10)
        hosting_provider.click()
        hosting_provider.send_keys("Example Hosting Provider")

        add_btn = driver.find_element(By.XPATH, '//button[@class="ons-btn ons-search__btn ons-btn--small"]')
        add_btn.click()
        driver.implicitly_wait(10)

        click_link(driver, "Save and continue")

def complete_database(driver):
        database = driver.find_element(By.ID, "database-input")
        database.click()
        database.send_keys("Example Database Provider")

        add_btn = driver.find_element(By.XPATH, '//button[@class="ons-btn ons-search__btn ons-btn--small"]')
        add_btn.click()
        driver.implicitly_wait(10)

        click_link(driver, "Save and continue")

        click_link(driver, "Finish section")
    
def complete_languages(driver):
        language = driver.find_element(By.ID, "languages-input")

        language.click()

        language.send_keys("Python")
        add_btn = driver.find_element(By.XPATH, '//button[@class="ons-btn ons-search__btn ons-btn--small"]')
        add_btn.click()

        driver.implicitly_wait(10)

        main_language = driver.find_element(By.XPATH, '//input[@value="main"]')
        main_language.click()

        language = driver.find_element(By.ID, "languages-input")

        language.click()

        language.send_keys("JavaScript")

        add_btn = driver.find_element(By.XPATH, '//button[@class="ons-btn ons-search__btn ons-btn--small"]')
        add_btn.click()

        click_link(driver, "Save and continue")

def complete_frameworks(driver):
        framework = driver.find_element(By.ID, "frameworks-input")

        framework.click()

        framework.send_keys("Django")

        add_btn = driver.find_element(By.XPATH, '//button[@class="ons-btn ons-search__btn ons-btn--small"]')
        add_btn.click()

        click_link(driver, "Save and continue")
    
def complete_integrations(driver):
        integrations = driver.find_element(By.ID, "integrations-input")
        
        integrations.click()

        integrations.send_keys("Github Actions")

        add_btn = driver.find_element(By.XPATH, '//button[@class="ons-btn ons-search__btn ons-btn--small"]')
        add_btn.click()

        click_link(driver, "Save and continue")

def complete_infrastructure(driver):
        infrastructure = driver.find_element(By.ID, "infrastructure-input")
        
        infrastructure.click()

        infrastructure.send_keys("AWS")

        add_btn = driver.find_element(By.XPATH, '//button[@class="ons-btn ons-search__btn ons-btn--small"]')
        add_btn.click()


        click_link(driver, "Save and continue")


        click_link(driver, "Finish section")


if __name__ == "__main__":
    unittest.main()

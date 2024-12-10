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
        """Set up testing"""
        self.driver = webdriver.Firefox()
        self.driver.get("http://localhost:8000")
        self.email = os.getenv("TEST_EMAIL")
        self.password = os.getenv("TEST_PASSWORD")
        self.wait = WebDriverWait(self.driver, 5)
        self.driver.refresh()

    def test_project_details(self):
        """Test creating a project from beginning to end"""
        driver = self.driver

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

        driver.get("http://localhost:8000/survey")

        self.complete_contact_details(driver)

        self.complete_project_details(driver)

        self.complete_tools_details(driver)

        driver.implicitly_wait(10)

        link = driver.find_elements(By.CLASS_NAME, "ons-summary__button")[1]

        self.wait.until(EC.element_to_be_clickable(link)).click()


        driver.implicitly_wait(10)

        self.click_link(driver, "Continue")

        self.complete_source_control(driver)

        self.complete_hosting(driver)

        self.complete_database(driver)

        link = driver.find_elements(By.CLASS_NAME, "ons-summary__button")[2]

        self.wait.until(EC.element_to_be_clickable(link)).click()

        self.click_link(driver, "Continue")

        self.complete_languages(driver)
        
        self.complete_frameworks(driver)

        self.complete_integrations(driver)

        self.complete_infrastructure(driver)

        self.click_link(driver, "Continue to Submission")

        self.assert_validation_page()

        button = driver.find_element(By.ID, 'submit-button')
        driver.execute_script("window.scrollTo(0, document.body.scrollHeight);")
        self.wait.until(EC.element_to_be_clickable(button)).click()
        time.sleep(10)

    def tearDown(self):
        self.driver.close()
    
    def click_link(self, driver, link_text):
        """Click link via text"""
        link = driver.find_element(By.LINK_TEXT, link_text)
        driver.execute_script("window.scrollTo(0, document.body.scrollHeight);")
        self.wait.until(EC.element_to_be_clickable(link)).click()
        driver.implicitly_wait(10)

    def click_radio(self, driver, options):
        """Randomly choose option from radio"""
        choice = random.choice(options)
        radio = driver.find_element(By.ID, choice)
        self.wait.until(EC.element_to_be_clickable(radio)).click()
        return choice

    def assert_validation_page(self):
        """Assert that the validation page has the correct details"""
        driver = self.driver
        assert driver.current_url == "http://localhost:8000/validate_details"
        assert "test@ons.gov.uk" in driver.find_element(By.ID, "technical_contact").text
        assert "testmanager@ons.gov.uk" in driver.find_element(By.ID, "delivery_manager").text
        assert "Selenium bot test" in driver.find_element(By.XPATH, "//div[@id='project_details']/ul/li[1]").text

        assert "selbottest" in driver.find_element(By.XPATH, "//div[@id='project_details']/ul/li[2]").text
        assert "https://example.com" in driver.find_element(By.XPATH, "//div[@id='project_details']/ul/li[3]").text
        assert "Active Support" or "Development" or "Unsupported" in driver.find_element(By.XPATH, "//div[@id='project_details']/ul/li[4]").text
        assert "In House" or (("Outsourced" or "Partnership") and "Example Company") in driver.find_element(By.XPATH, "//div[@id='developed_details']/ul/li[1]").text

        assert "Bitbucket" or "Github" or "Gitlab" in driver.find_element(By.XPATH, "//div[@id='source_control_details']/ul/li[1]").text
        assert "https://example.com" and "Test Description" in driver.find_element(By.XPATH, "//div[@id='source_control_details']/ul/li[2]").text
        assert "Example Hosting Provider" or "On-Premises" in driver.find_element(By.XPATH, "//div[@id='hosting_details']/ul/li[1]").text
        assert "Example Database Provider" in driver.find_element(By.XPATH, "//div[@id='database_details']/ul/li[1]").text

        assert "Python" in driver.find_element(By.XPATH, "//div[@id='languages_details']/ul/li[1]").text
        assert "Django" in driver.find_element(By.XPATH, "//div[@id='framework_details']/ul/li[1]").text
        assert "Github Actions" in driver.find_element(By.XPATH, "//div[@id='integration_details']/ul/li[1]").text
        assert "AWS" in driver.find_element(By.XPATH, "//div[@id='infrastructure_details']/ul/li[1]").text


    def complete_contact_details(self, driver):
        """Complete contact details i.e technical contact and delivery manager

        Args:
            driver (webdriver.Firefox): The driver that interacts with the browser
        """
        link = driver.find_elements(By.CLASS_NAME, "ons-summary__button")[0]
        print(link.text)
        self.wait.until(EC.element_to_be_clickable(link)).click()

        driver.implicitly_wait(10)
        link = driver.find_element(By.LINK_TEXT, "Continue")
        self.wait.until(EC.element_to_be_clickable(link)).click()

        driver.implicitly_wait(10)
        email = driver.find_element(By.ID, "contact-email")
        self.wait.until(EC.element_to_be_clickable(email)).click()
        email.send_keys("test@ons.gov.uk")

        choice = self.click_radio(driver,  ['Grade 6', "Grade 7", "SEO", "HEO", "other"])

        if choice == "other":
            other_input = driver.find_element(By.ID, "other-input")
            self.wait.until(EC.element_to_be_clickable(other_input)).click()
            other_input.send_keys("Example Role")
        
        self.click_link(driver, "Save and continue")
    
        email = driver.find_element(By.ID, "contact-email")
        self.wait.until(EC.element_to_be_clickable(email)).click()
        email.send_keys("testmanager@ons.gov.uk")

        choice = self.click_radio(driver, ['Grade 6', "Grade 7", "SEO", "HEO", "other"])

        if choice == "other":
            other_input = driver.find_element(By.ID, "other-input")
            self.wait.until(EC.element_to_be_clickable(other_input)).click()
            other_input.send_keys("Example Role")
        
        self.click_link(driver, "Save and continue")
        
    def complete_project_details(self, driver):
        """Complete basic project details

        Args:
            driver (webdriver.Firefox: The driver that interacts with the browser
        """
        project_name = driver.find_element(By.ID, "project-name")
        project_short_name = driver.find_element(By.ID, "project-short-name")
        documentation_link = driver.find_element(By.ID, "documentation-link")
        project_description = driver.find_element(By.ID, "project-description")

        self.wait.until(EC.element_to_be_clickable(project_name)).click()
        project_name.send_keys("Selenium bot test")
        self.wait.until(EC.element_to_be_clickable(project_short_name)).click()
        project_short_name.send_keys("selbottest")
        self.wait.until(EC.element_to_be_clickable(documentation_link)).click()
        documentation_link.send_keys("https://example.com")
        self.wait.until(EC.element_to_be_clickable(project_description)).click()
        project_description.send_keys("https://example.com")
        self.click_link(driver, "Save and continue")

    def complete_tools_details(self, driver):
        """Complete details used on tooling

        Args:
            driver (webdriver.Firefox): The driver that interacts with the browser
        """
        choice = self.click_radio(driver, ["in-house", "outsourced", "partnership"])

        if choice == "partnership":
            company_name = driver.find_element(By.ID, "other-input-2")
            self.wait.until(EC.element_to_be_clickable(company_name)).click()
            company_name.send_keys("Example Company")
        elif choice == "outsourced":
            company_name = driver.find_element(By.ID, "other-input-1")
            self.wait.until(EC.element_to_be_clickable(company_name)).click()
            company_name.send_keys("Example Company")

        self.click_link(driver, "Save and continue")

        self.click_radio(driver, ["Development", "Active Support", "Unsupported"])

        self.click_link(driver, "Save and continue")

        self.click_link(driver, "Finish section")

    def complete_source_control(self, driver):
        """Complete details on source control

        Args:
            driver (webdriver.Firefox): Complete details on source control
        """
        choice = self.click_radio(driver, ["github", "gitlab", "other"])

        if choice == "other":
            source_control = driver.find_element(By.ID, "other-input")
            self.wait.until(EC.element_to_be_clickable(source_control)).click()
            source_control.send_keys("Bitbucket")
        
        self.click_link(driver, "Save and continue")

        source_control_link = driver.find_element(By.ID, "source_control_link-input")
        self.wait.until(EC.element_to_be_clickable(source_control_link)).click()
        source_control_link.send_keys("https://example.com")
        
        source_control_description = driver.find_element(By.ID, "source_control_desc-input")
        self.wait.until(EC.element_to_be_clickable(source_control_description)).click()
        source_control_description.send_keys("Test Description")

        # add_btn = driver.find_elements(By.CLASS_NAME, "ons-btn")[0]
        add_btn = driver.find_element(By.XPATH, '//button[@class="ons-btn ons-search__btn ons-btn--small"]')
        self.wait.until(EC.element_to_be_clickable(add_btn)).click()
        self.click_link(driver, "Save and continue")

    def complete_hosting(self, driver):
        """Complete details on hosting services

        Args:
            driver (webdriver.Firefox): The driver that interacts with the browser
        """
        choice = self.click_radio(driver, ["On-premises", "Cloud", "Hybrid"])
        self.click_link(driver, "Save and continue")

        if choice != "On-premises":
            hosting_provider = driver.find_element(By.ID, "hosting-input")
            driver.implicitly_wait(10)
            self.wait.until(EC.element_to_be_clickable(hosting_provider)).click()
            hosting_provider.send_keys("Example Hosting Provider")

            add_btn = driver.find_element(By.XPATH, '//button[@class="ons-btn ons-search__btn ons-btn--small"]')
            self.wait.until(EC.element_to_be_clickable(add_btn)).click()
            self.click_link(driver, "Save and continue")
        driver.implicitly_wait(10)

    def complete_database(self, driver):
        """Complete details on datbases used

        Args:
            driver (webdriver.Firefox): The driver that interacts with the browser
        """
        database = driver.find_element(By.ID, "database-input")
        self.wait.until(EC.element_to_be_clickable(database)).click()
        database.send_keys("Example Database Provider")

        add_btn = driver.find_element(By.XPATH, '//button[@class="ons-btn ons-search__btn ons-btn--small"]')
        self.wait.until(EC.element_to_be_clickable(add_btn)).click()
        driver.implicitly_wait(10)

        self.click_link(driver, "Save and continue")

        self.click_link(driver, "Finish section")
        
    def complete_languages(self, driver):
        """Complete details on languages used

        Args:
            driver (webdriver.Firefox): The driver that interacts with the browser
        """
        language = driver.find_element(By.ID, "languages-input")

        self.wait.until(EC.element_to_be_clickable(language)).click()

        language.send_keys("Python")
        add_btn = driver.find_element(By.XPATH, '//button[@class="ons-btn ons-search__btn ons-btn--small"]')
        self.wait.until(EC.element_to_be_clickable(add_btn)).click()
        driver.implicitly_wait(10)

        main_language = driver.find_element(By.XPATH, '//input[@value="main"]')
        self.wait.until(EC.element_to_be_clickable(main_language)).click()
        language = driver.find_element(By.ID, "languages-input")

        self.wait.until(EC.element_to_be_clickable(language)).click()
        language.send_keys("JavaScript")

        add_btn = driver.find_element(By.XPATH, '//button[@class="ons-btn ons-search__btn ons-btn--small"]')
        self.wait.until(EC.element_to_be_clickable(add_btn)).click()
        self.click_link(driver, "Save and continue")

    def complete_frameworks(self, driver):
        """Complete details on frameworks used

        Args:
            driver (webdriver.Firefox): The driver that interacts with the browser
        """
        framework = driver.find_element(By.ID, "frameworks-input")

        self.wait.until(EC.element_to_be_clickable(framework)).click()
        framework.send_keys("Django")

        add_btn = driver.find_element(By.XPATH, '//button[@class="ons-btn ons-search__btn ons-btn--small"]')
        self.wait.until(EC.element_to_be_clickable(add_btn)).click()
        self.click_link(driver, "Save and continue")
        
    def complete_integrations(self, driver):
        """Completes the integrations section of the project creation form.

        Args:
            driver (webdriver.Firefox): The driver that interacts with the browser
        """
        integrations = driver.find_element(By.ID, "integrations-input")
        
        self.wait.until(EC.element_to_be_clickable(integrations)).click()
        integrations.send_keys("Github Actions")

        add_btn = driver.find_element(By.XPATH, '//button[@class="ons-btn ons-search__btn ons-btn--small"]')
        self.wait.until(EC.element_to_be_clickable(add_btn)).click()
        self.click_link(driver, "Save and continue")

    def complete_infrastructure(self, driver):
        """Completes the infrastructure section of the project creation process.

        Args:
            driver (webdriver.Firefox): The driver that interacts with the browser
        """
        infrastructure = driver.find_element(By.ID, "infrastructure-input")
        
        self.wait.until(EC.element_to_be_clickable(infrastructure)).click()
        infrastructure.send_keys("AWS")

        add_btn = driver.find_element(By.XPATH, '//button[@class="ons-btn ons-search__btn ons-btn--small"]')
        self.wait.until(EC.element_to_be_clickable(add_btn)).click()
        self.click_link(driver, "Save and continue")

        self.click_link(driver, "Finish section")


if __name__ == "__main__":
    unittest.main()

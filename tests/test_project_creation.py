import unittest
from selenium import webdriver
from selenium.webdriver.common.keys import Keys
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from test_utils import TestUtil
import requests
import os
import random
import time
import logging

logging.basicConfig(level=logging.INFO)

class TestProjectCreation(unittest.TestCase, TestUtil):

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

        self.project_name = self.generate_words(3)
        self.project_short_name = self.generate_words(1, "").lower()
        self.project_desc = self.generate_words(5)
        self.documentation_link = f"https://{"".join(self.generate_words(1, "")).lower()}.com"
        self.source_control_link = f"https://{"".join(self.generate_words(1, "")).lower()}.com"
        self.source_control_description = self.generate_words(5)
        self.hosting_provider = self.generate_words(1, "")
        self.database_provider = self.generate_words(1, "")
        self.language = random.choice(["Python", "JavaScript", "C++", "Java", "Rust"])
        self.framework = random.choice(["Django", "React", "Angular", "Vue", "Flask"])
        self.integration = random.choice(["Github Actions", "Jenkins", "Travis CI", "Circle CI"])
        self.infrastructure = random.choice(["AWS", "Azure", "Google Cloud"])
    
    def generate_words(self, num_words, delimiter=" "):
        """Generates a string of random words

        Args:
            num_words (int): Number of words to be generated
            delimiter (str, optional): Defines how to seprate words. Defaults to " ".

        Returns:
            str: Final string of words
        """
        return delimiter.join(list(map(str.title, [requests.get("https://random-word-api.herokuapp.com/word").json()[0] for word in range(num_words)])))

    def test_project_details(self):
        """Test creating a project from start to finish"""
        driver = self.driver

        self.login(driver)

        driver.get("http://localhost:8000/survey")

        self.complete_contact_details(driver)

        self.complete_project_details(driver)

        self.complete_tools_details(driver)

        driver.implicitly_wait(10)

        link = driver.find_elements(By.CLASS_NAME, "ons-summary__button")[1]

        self.wait.until(EC.element_to_be_clickable(link)).click()

        self.click_link(driver, "Continue")

        self.complete_source_control(driver)

        self.complete_hosting(driver)

        self.complete_database(driver)

        driver.implicitly_wait(10)

        link = driver.find_elements(By.CLASS_NAME, "ons-summary__button")[2]

        self.wait.until(EC.element_to_be_clickable(link)).click()

        self.click_link(driver, "Continue")

        self.complete_languages(driver)
        
        self.complete_frameworks(driver)

        self.complete_integrations(driver)

        self.complete_infrastructure(driver)

        self.complete_code_editors(driver)

        self.complete_user_interface(driver)

        self.complete_diagrams(driver)

        self.project_tracking(driver)

        self.complete_documentation(driver)

        self.complete_communication(driver)

        self.complete_collaboration(driver)

        self.complete_incident_management(driver)

        self.click_link(driver, "Continue to Submission")

        self.assert_validation_page()

        driver.implicitly_wait(10)

        button = driver.find_element(By.ID, 'submit-button')
        driver.execute_script("window.scrollTo(0, document.body.scrollHeight);")
        self.wait.until(EC.element_to_be_clickable(button)).click()
        
        assert driver.current_url == "http://localhost:8000/dashboard"
        assert self.project_name in driver.find_element(By.ID, "my-projects").text
        self.assert_project_details()
        
    def tearDown(self):
        self.driver.close()

    def assert_validation_page(self):
        """Assert that the validation page has the correct details"""
        driver = self.driver
        assert driver.current_url == "http://localhost:8000/validate_details"
        assert "test@ons.gov.uk" in driver.find_element(By.ID, "technical_contact").text
        assert "testmanager@ons.gov.uk" in driver.find_element(By.ID, "delivery_manager").text
        assert self.project_name in driver.find_element(By.XPATH, "//div[@id='project_details']/ul/li[1]").text

        assert self.project_short_name in driver.find_element(By.XPATH, "//div[@id='project_details']/ul/li[2]").text
        assert self.documentation_link in driver.find_element(By.XPATH, "//div[@id='project_details']/ul/li[3]").text
        assert "Active Support" or "Development" or "Unsupported" in driver.find_element(By.XPATH, "//div[@id='project_details']/ul/li[4]").text
        assert "In House" or (("Outsourced" or "Partnership") and "Example Company") in driver.find_element(By.XPATH, "//div[@id='developed_details']/ul/li[1]").text

        assert "Bitbucket" or "Github" or "Gitlab" in driver.find_element(By.XPATH, "//div[@id='source_control_details']/ul/li[1]").text
        assert self.source_control_link and self.source_control_description in driver.find_element(By.XPATH, "//div[@id='source_control_details']/ul/li[2]").text
        assert self.hosting_provider or "On-Premises" in driver.find_element(By.XPATH, "//div[@id='hosting_details']/ul/li[1]").text
        assert self.database_provider in driver.find_element(By.XPATH, "//div[@id='database_details']/ul/li[1]").text

        assert self.language in driver.find_element(By.XPATH, "//div[@id='languages_details']/ul/li[1]").text
        assert self.framework in driver.find_element(By.XPATH, "//div[@id='framework_details']/ul/li[1]").text
        assert self.integration in driver.find_element(By.XPATH, "//div[@id='integration_details']/ul/li[1]").text
        assert self.infrastructure in driver.find_element(By.XPATH, "//div[@id='infrastructure_details']/ul/li[1]").text

        assert "VSCode" in driver.find_element(By.XPATH, "//div[@id='code_editor_details']/ul/li[1]").text
        assert "Figma" in driver.find_element(By.XPATH, "//div[@id='user_interface_details']/ul/li[1]").text
        assert "Draw.io" in driver.find_element(By.XPATH, "//div[@id='diagram_details']/ul/li[1]").text
        assert len(driver.find_element(By.XPATH, "//div[@id='project_tracking_details']").text) > 0
        assert "Confluence" in driver.find_element(By.XPATH, "//div[@id='documentation_details']/ul/li[1]").text
        assert "Slack" in driver.find_element(By.XPATH, "//div[@id='communication_details']/ul/li[1]").text
        assert "Github" in driver.find_element(By.XPATH, "//div[@id='collaboration_details']/ul/li[1]").text
        assert len(driver.find_element(By.XPATH, "//div[@id='incident_management_details']").text) > 0


    
    def assert_project_details(self):
        driver = self.driver
        self.click_link(driver, self.project_name)

        assert "test@ons.gov.uk" in driver.find_elements(By.CLASS_NAME, "ons-summary__text")[0].text
        assert "testmanager@ons.gov.uk" in driver.find_elements(By.CLASS_NAME, "ons-summary__text")[1].text
        assert self.project_name and self.project_short_name and self.project_desc and self.documentation_link in driver.find_elements(By.CLASS_NAME, "ons-summary__text")[2].text
        assert "In House" or "Outsourced" or "Partnership" in driver.find_elements(By.CLASS_NAME, "ons-summary__text")[3].text
        
        assert "Github" or "Gitlab" or "Bitbucket" in driver.find_elements(By.CLASS_NAME, "ons-summary__text")[4].text
        assert self.source_control_link and self.source_control_description in driver.find_elements(By.CLASS_NAME, "ons-summary__text")[5].text
        assert self.hosting_provider or "On-Premises"in driver.find_elements(By.CLASS_NAME, "ons-summary__text")[6].text
        assert self.database_provider in driver.find_elements(By.CLASS_NAME, "ons-summary__text")[7].text
        assert self.framework in driver.find_elements(By.CLASS_NAME, "ons-summary__text")[8].text
        
        assert self.language in driver.find_elements(By.CLASS_NAME, "ons-summary__text")[9].text
        assert self.integration in driver.find_elements(By.CLASS_NAME, "ons-summary__text")[10].text
        assert self.infrastructure in driver.find_elements(By.CLASS_NAME, "ons-summary__text")[11].text

        assert "VSCode" in driver.find_elements(By.CLASS_NAME, "ons-summary__text")[12].text
        assert "Figma" in driver.find_elements(By.CLASS_NAME, "ons-summary__text")[13].text
        assert "Draw.io" in driver.find_elements(By.CLASS_NAME, "ons-summary__text")[14].text
        assert len(driver.find_elements(By.CLASS_NAME, "ons-summary__text")[15].text) > 0
        assert "Confluence" in driver.find_elements(By.CLASS_NAME, "ons-summary__text")[16].text
        assert "Slack" in driver.find_elements(By.CLASS_NAME, "ons-summary__text")[17].text
        assert "Github" in driver.find_elements(By.CLASS_NAME, "ons-summary__text")[18].text
        assert len(driver.find_elements(By.CLASS_NAME, "ons-summary__text")[19].text) > 0


    def complete_contact_details(self, driver):
        """Complete contact details i.e technical contact and delivery manager

        Args:
            driver (webdriver.Firefox): The driver that interacts with the browser
        """
        logging.info("Testing complete_contact_details...")
        driver.implicitly_wait(10)
        link = driver.find_elements(By.CLASS_NAME, "ons-summary__button")[0]

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
            driver.implicitly_wait(10)
            other_input = driver.find_element(By.ID, "other-input")
            self.wait.until(EC.element_to_be_clickable(other_input)).click()
            other_input.send_keys("Example Role")
        
        self.click_link(driver, "Save and continue")
    
        driver.implicitly_wait(10)
        email = driver.find_element(By.ID, "contact-email")
        self.wait.until(EC.element_to_be_clickable(email)).click()
        email.send_keys("testmanager@ons.gov.uk")

        choice = self.click_radio(driver, ['Grade 6', "Grade 7", "SEO", "HEO", "other"])

        if choice == "other":
            driver.implicitly_wait(10)
            other_input = driver.find_element(By.ID, "other-input")
            self.wait.until(EC.element_to_be_clickable(other_input)).click()
            other_input.send_keys("Example Role")
        
        self.click_link(driver, "Save and continue")
        
    def complete_project_details(self, driver):
        """Complete basic project details

        Args:
            driver (webdriver.Firefox: The driver that interacts with the browser
        """
        logging.info("Testing complete_project_details...")

        driver.implicitly_wait(10)
        project_name = driver.find_element(By.ID, "project-name")

        driver.implicitly_wait(10)
        project_short_name = driver.find_element(By.ID, "project-short-name")

        driver.implicitly_wait(10)
        documentation_link = driver.find_element(By.ID, "documentation-link")

        driver.implicitly_wait(10)
        project_description = driver.find_element(By.ID, "project-description")

        self.wait.until(EC.element_to_be_clickable(project_name)).click()
        project_name.send_keys(self.project_name)

        self.wait.until(EC.element_to_be_clickable(project_short_name)).click()
        project_short_name.send_keys(self.project_short_name)

        self.wait.until(EC.element_to_be_clickable(documentation_link)).click()
        documentation_link.send_keys(self.documentation_link)

        self.wait.until(EC.element_to_be_clickable(project_description)).click()
        project_description.send_keys(self.project_desc)

        self.click_link(driver, "Save and continue")

    def complete_tools_details(self, driver):
        """Complete details used on tooling

        Args:
            driver (webdriver.Firefox): The driver that interacts with the browser
        """
        logging.info("Testing complete_tools_details...")
        choice = self.click_radio(driver, ["in-house", "outsourced", "partnership"])

        if choice == "partnership":
            driver.implicitly_wait(10)
            company_name = driver.find_element(By.ID, "other-input-2")
            self.wait.until(EC.element_to_be_clickable(company_name)).click()
            company_name.send_keys("Example Company")
        elif choice == "outsourced":
            driver.implicitly_wait(10)
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
        logging.info("Testing complete_source_control...")

        choice = self.click_radio(driver, ["github", "gitlab", "other"])

        if choice == "other":
            driver.implicitly_wait(10)
            source_control = driver.find_element(By.ID, "other-input")
            self.wait.until(EC.element_to_be_clickable(source_control)).click()
            source_control.send_keys("Bitbucket")
        
        self.click_link(driver, "Save and continue")

        driver.implicitly_wait(10)
        source_control_link = driver.find_element(By.ID, "source_control_link-input")
        self.wait.until(EC.element_to_be_clickable(source_control_link)).click()
        source_control_link.send_keys(self.source_control_link)
        
        driver.implicitly_wait(10)
        source_control_description = driver.find_element(By.ID, "source_control_desc-input")
        self.wait.until(EC.element_to_be_clickable(source_control_description)).click()
        source_control_description.send_keys(self.source_control_description)

        driver.implicitly_wait(10)
        add_btn = driver.find_element(By.XPATH, '//button[@class="ons-btn ons-search__btn ons-btn--small"]')
        self.wait.until(EC.element_to_be_clickable(add_btn)).click()

        self.click_link(driver, "Save and continue")


    def complete_hosting(self, driver):
        """Complete details on hosting services

        Args:
            driver (webdriver.Firefox): The driver that interacts with the browser
        """
        logging.info("Testing complete_hosting...")
        choice = self.click_radio(driver, ["On-premises", "Cloud", "Hybrid"])
        self.click_link(driver, "Save and continue")

        if choice != "On-premises":
            driver.implicitly_wait(10)
            hosting_provider = driver.find_element(By.ID, "hosting-input")
            self.wait.until(EC.element_to_be_clickable(hosting_provider)).click()
            hosting_provider.send_keys(self.hosting_provider)

            driver.implicitly_wait(10)
            add_btn = driver.find_element(By.XPATH, '//button[@class="ons-btn ons-search__btn ons-btn--small"]')
            self.wait.until(EC.element_to_be_clickable(add_btn)).click()
            self.click_link(driver, "Save and continue")
        driver.implicitly_wait(10)

    def complete_database(self, driver):
        """Complete details on datbases used

        Args:
            driver (webdriver.Firefox): The driver that interacts with the browser
        """
        logging.info("Testing complete_database...")
        driver.implicitly_wait(10)
        database = driver.find_element(By.ID, "database-input")
        self.wait.until(EC.element_to_be_clickable(database)).click()
        database.send_keys(self.database_provider)

        driver.implicitly_wait(10)
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
        logging.info("Testing complete_languages...")
        driver.implicitly_wait(10)
        language = driver.find_element(By.ID, "languages-input")

        self.wait.until(EC.element_to_be_clickable(language)).click()

        language.send_keys(self.language)
        driver.implicitly_wait(10)
        add_btn = driver.find_element(By.XPATH, '//button[@class="ons-btn ons-search__btn ons-btn--small"]')
        self.wait.until(EC.element_to_be_clickable(add_btn)).click()
        driver.implicitly_wait(10)

        driver.implicitly_wait(10)
        main_language = driver.find_element(By.XPATH, '//input[@value="main"]')
        self.wait.until(EC.element_to_be_clickable(main_language)).click()
        language = driver.find_element(By.ID, "languages-input")

        self.wait.until(EC.element_to_be_clickable(language)).click()
        language.send_keys("JavaScript")

        driver.implicitly_wait(10)
        add_btn = driver.find_element(By.XPATH, '//button[@class="ons-btn ons-search__btn ons-btn--small"]')
        self.wait.until(EC.element_to_be_clickable(add_btn)).click()
        self.click_link(driver, "Save and continue")

    def complete_frameworks(self, driver):
        """Complete details on frameworks used

        Args:
            driver (webdriver.Firefox): The driver that interacts with the browser
        """
        logging.info("Testing complete_frameworks...")
        driver.implicitly_wait(10)
        framework = driver.find_element(By.ID, "frameworks-input")

        self.wait.until(EC.element_to_be_clickable(framework)).click()
        framework.send_keys(self.framework)

        driver.implicitly_wait(10)
        add_btn = driver.find_element(By.XPATH, '//button[@class="ons-btn ons-search__btn ons-btn--small"]')
        self.wait.until(EC.element_to_be_clickable(add_btn)).click()
        self.click_link(driver, "Save and continue")
        
    def complete_integrations(self, driver):
        """Completes the integrations section of the project creation form.

        Args:
            driver (webdriver.Firefox): The driver that interacts with the browser
        """
        logging.info("Testing complete_integrations...")
    
        driver.implicitly_wait(10)
        integrations = driver.find_element(By.ID, "integrations-input")
        
        self.wait.until(EC.element_to_be_clickable(integrations)).click()
        integrations.send_keys(self.integration)

        driver.implicitly_wait(10)
        add_btn = driver.find_element(By.XPATH, '//button[@class="ons-btn ons-search__btn ons-btn--small"]')
        self.wait.until(EC.element_to_be_clickable(add_btn)).click()
        self.click_link(driver, "Save and continue")

    def complete_infrastructure(self, driver):
        """Completes the infrastructure section of the project creation process.

        Args:
            driver (webdriver.Firefox): The driver that interacts with the browser
        """
        logging.info("Testing complete_infrastructure...")
        driver.implicitly_wait(10)
        infrastructure = driver.find_element(By.ID, "infrastructure-input")
        
        self.wait.until(EC.element_to_be_clickable(infrastructure)).click()
        infrastructure.send_keys(self.infrastructure)

        driver.implicitly_wait(10)
        add_btn = driver.find_element(By.XPATH, '//button[@class="ons-btn ons-search__btn ons-btn--small"]')
        self.wait.until(EC.element_to_be_clickable(add_btn)).click()
        self.click_link(driver, "Save and continue")

        self.click_link(driver, "Finish section")
    
    def complete_code_editors(self, driver):
        """Completes the code editors section of the project creation process.

        Args:
            driver (webdriver.Firefox): The driver that interacts with the browser
        """
        logging.info("Testing complete_code_editors...")
        link = driver.find_elements(By.CLASS_NAME, "ons-summary__button")[3]
        self.wait.until(EC.element_to_be_clickable(link)).click()
        self.click_link(driver, "Continue")
        
        driver.implicitly_wait(10)
        code_editors = driver.find_element(By.ID, "code_editors-input")
        
        self.wait.until(EC.element_to_be_clickable(code_editors)).click()
        code_editors.send_keys("VSCode")

        driver.implicitly_wait(10)
        add_btn = driver.find_element(By.XPATH, '//button[@class="ons-btn ons-search__btn ons-btn--small"]')
        self.wait.until(EC.element_to_be_clickable(add_btn)).click()
        self.click_link(driver, "Save and continue")
    
    def complete_user_interface(self, driver):
        """Completes the user interface section of the project creation process.

        Args:
            driver (webdriver.Firefox): The driver that interacts with the browser
        """
        logging.info("Testing complete_user_interface...")
        driver.implicitly_wait(10)
        user_interface = driver.find_element(By.ID, "user_interface-input")
        
        self.wait.until(EC.element_to_be_clickable(user_interface)).click()
        user_interface.send_keys("Figma")

        driver.implicitly_wait(10)
        add_btn = driver.find_element(By.XPATH, '//button[@class="ons-btn ons-search__btn ons-btn--small"]')
        self.wait.until(EC.element_to_be_clickable(add_btn)).click()
        self.click_link(driver, "Save and continue")
    
    def complete_diagrams(self, driver):
        """Completes the diagrams section of the project creation process.

        Args:
            driver (webdriver.Firefox): The driver that interacts with the browser
        """
        logging.info("Testing complete_diagrams...")
        driver.implicitly_wait(10)
        diagrams = driver.find_element(By.ID, "diagrams-input")
        
        self.wait.until(EC.element_to_be_clickable(diagrams)).click()
        diagrams.send_keys("Draw.io")

        driver.implicitly_wait(10)
        add_btn = driver.find_element(By.XPATH, '//button[@class="ons-btn ons-search__btn ons-btn--small"]')
        self.wait.until(EC.element_to_be_clickable(add_btn)).click()
        self.click_link(driver, "Save and continue")
    
    def project_tracking(self, driver):
        """Completes the project tracking section of the project creation process.

        Args:
            driver (webdriver.Firefox): The driver that interacts with the browser
        """
        logging.info("Testing project_tracking...")
        driver.implicitly_wait(10)
        choice = self.click_radio(driver, ["jira", "trello", "other"])
        if choice == "other":
            driver.implicitly_wait(10)
            other_input = driver.find_element(By.ID, "other-input")
            self.wait.until(EC.element_to_be_clickable(other_input)).click()
            other_input.send_keys("Asana")
        self.click_link(driver, "Save and continue")
    
    def complete_documentation(self, driver):
        """Completes the documentation section of the project creation process.

        Args:
            driver (webdriver.Firefox): The driver that interacts with the browser
        """
        logging.info("Testing complete_documentation...")
        driver.implicitly_wait(10)
        documentation = driver.find_element(By.ID, "documentation-input")
        
        self.wait.until(EC.element_to_be_clickable(documentation)).click()
        documentation.send_keys("Confluence")

        driver.implicitly_wait(10)
        add_btn = driver.find_element(By.XPATH, '//button[@class="ons-btn ons-search__btn ons-btn--small"]')
        self.wait.until(EC.element_to_be_clickable(add_btn)).click()
        self.click_link(driver, "Save and continue")
    
    def complete_communication(self, driver):
        """Completes the communication section of the project creation process.

        Args:
            driver (webdriver.Firefox): The driver that interacts with the browser
        """
        logging.info("Testing complete_communication...")
        driver.implicitly_wait(10)
        communication = driver.find_element(By.ID, "communication-input")
        
        self.wait.until(EC.element_to_be_clickable(communication)).click()
        communication.send_keys("Slack")

        driver.implicitly_wait(10)
        add_btn = driver.find_element(By.XPATH, '//button[@class="ons-btn ons-search__btn ons-btn--small"]')
        self.wait.until(EC.element_to_be_clickable(add_btn)).click()
        self.click_link(driver, "Save and continue")
    
    def complete_collaboration(self, driver):
        """Completes the collaboration section of the project creation process.

        Args:
            driver (webdriver.Firefox): The driver that interacts with the browser
        """
        logging.info("Testing complete_collaboration...")
        driver.implicitly_wait(10)
        collaboration = driver.find_element(By.ID, "collaboration-input")
        
        self.wait.until(EC.element_to_be_clickable(collaboration)).click()
        collaboration.send_keys("Github")

        driver.implicitly_wait(10)
        add_btn = driver.find_element(By.XPATH, '//button[@class="ons-btn ons-search__btn ons-btn--small"]')
        self.wait.until(EC.element_to_be_clickable(add_btn)).click()
        self.click_link(driver, "Save and continue")
    
    def complete_incident_management(self, driver):
        """Completes the incident management section of the project creation process.

        Args:
            driver (webdriver.Firefox): The driver that interacts with the browser
        """
        logging.info("Testing complete_incident_management...")
        driver.implicitly_wait(10)
        choice = self.click_radio(driver, ["servicenow", "jira", "other"])
        if choice == 'other':
            driver.implicitly_wait(10)
            other_input = driver.find_element(By.ID, "other-input")
            self.wait.until(EC.element_to_be_clickable(other_input)).click()
            other_input.send_keys("Zendesk")
        self.click_link(driver, "Save and continue")
        self.click_link(driver, "Finish section")



if __name__ == "__main__":
    unittest.main()

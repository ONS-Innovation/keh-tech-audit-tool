import logging
import os
import random
import unittest

import requests
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.support.ui import WebDriverWait
from test_utils import TestUtil

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
        self.programme_name = self.generate_words(3)
        self.programme_short_name = "".join(
            [word[0] for word in self.programme_name.split()]
        ).upper()
        self.project_short_name = self.generate_words(1, "").lower()
        self.project_desc = self.generate_words(5)
        self.documentation_link = (
            f"https://{"".join(self.generate_words(1, "")+"example").lower()}.com"
        )
        self.source_control_link = (
            f"https://{"".join(self.generate_words(1, "")+"example").lower()}.com"
        )
        self.source_control_description = self.generate_words(5)
        self.hosting_provider = self.generate_words(1, "")
        self.database_provider = self.generate_words(1, "")
        self.environments = {
                "dev": random.choice([True, False]),
                "int" : random.choice([True, False]),
                "uat": random.choice([True, False]),
                "preprod": random.choice([True, False]),
                "prod": random.choice([True, False]),
                "postprod": random.choice([True, False]),
        }
        self.language = random.choice(["Python", "JavaScript", "C++", "Java", "Rust"])
        self.framework = random.choice(["Django", "React", "Angular", "Vue", "Flask"])
        self.integration = random.choice(
            ["Github Actions", "Jenkins", "Travis CI", "Circle CI"]
        )
        self.infrastructure = random.choice(["AWS", "Azure", "GCP"])
        self.publishing = random.choice(["Github", "PyPi", "AWS ECR Public", "AWS ECR Private"])
        self._test_passed = False

    def generate_words(self, num_words, delimiter=" "):
        """Generates a string of random words

        Args:
            num_words (int): Number of words to be generated
            delimiter (str, optional): Defines how to seprate words. Defaults to " ".

        Returns:
            str: Final string of words
        """
        words = requests.get(
            f"https://random-word-api.vercel.app/api?words={num_words}"
        ).json()
        return delimiter.join(word.title() for word in words[:num_words])

    def tearDown(self):
        """Tear down the test - only close the browser if the test passed"""
        if self._outcome.success:
            self.driver.close()
        else:
            logging.info("Test failed - browser left open for debugging")

    def test_project_details(self):
        """Test creating a project from start to finish"""
        try:
            driver = self.driver

            self.login(driver)

            driver.get("http://localhost:8000/survey")

            self.complete_contact_details(driver)
            self.complete_project_details(driver)
            self.complete_tools_details(driver)
            self.complete_project_dependecies(driver)

            driver.implicitly_wait(10)
            link = driver.find_elements(By.CLASS_NAME, "ons-summary__button")[1]
            self.wait.until(EC.element_to_be_clickable(link)).click()
            self.click_link(driver, "Continue")

            self.complete_source_control(driver)
            self.complete_hosting(driver)
            self.complete_database(driver)
            self.complete_environments(driver)

            driver.implicitly_wait(10)
            link = driver.find_elements(By.CLASS_NAME, "ons-summary__button")[2]
            self.wait.until(EC.element_to_be_clickable(link)).click()
            self.click_link(driver, "Continue")

            self.complete_languages(driver)
            self.complete_frameworks(driver)
            self.complete_integrations(driver)
            self.complete_infrastructure(driver)
            self.complete_publishing(driver)
            self.complete_code_editors(driver)
            self.complete_user_interface(driver)
            self.complete_diagrams(driver)
            self.project_tracking(driver)
            self.complete_documentation(driver)
            self.complete_communication(driver)
            self.complete_collaboration(driver)
            self.complete_incident_management(driver)
            self.complete_miscellaneous(driver)

            self.click_link(driver, "Continue to submission")

            self.assert_validation_page()

            driver.implicitly_wait(10)
            button = driver.find_element(By.ID, "submit-button-btn")
            driver.execute_script("window.scrollTo(0, document.body.scrollHeight);")
            self.wait.until(EC.element_to_be_clickable(button)).click()
            driver.implicitly_wait(10)
            # Wait for redirect and page load
            WebDriverWait(driver, 20).until(
                EC.url_to_be("http://localhost:8000/dashboard")
            )
            assert driver.current_url == "http://localhost:8000/dashboard"
            assert self.project_name in driver.find_element(By.ID, "my-projects").text
            self.assert_project_details()

            self._test_passed = True
        except Exception as e:
            logging.error(f"Test failed with error: {e}")
            raise

    def assert_validation_page(self):
        """Assert that the validation page has the correct details"""
        driver = self.driver
        assert driver.current_url == "http://localhost:8000/validate_details"
        assert "test@ons.gov.uk" in driver.find_element(By.ID, "technical-contact").text
        assert (
            "testmanager@ons.gov.uk"
            in driver.find_element(By.ID, "delivery-manager").text
        )
        project_details = driver.find_element(By.ID, "project-details").text
        assert self.programme_name in project_details
        assert self.programme_short_name in project_details
        assert self.project_name in project_details
        assert self.project_short_name in project_details
        assert self.documentation_link in project_details

        assert (
            "In House"
            or (("Outsourced" or "Partnership") and "Example Company")
            in driver.find_element(By.XPATH, "//div[@id='developed-details']/p[0]").text
        )

        source_control_details = driver.find_element(
            By.ID, "source-control-details"
        ).text
        assert "github" or "gitlab" or "bitbucket" in source_control_details
        assert (
            self.source_control_description
            and self.source_control_link in source_control_details
        )

        assert (
            self.hosting_provider
            or "On-Premises"
            in driver.find_element(By.XPATH, "//div[@id='hosting-details']").text
        )
        assert (
            self.database_provider
            in driver.find_element(By.XPATH, "//div[@id='database-details']").text
        )
        assert (
            environments_to_string(self.environments)
            in driver.find_element(By.XPATH, "//div[@id='environments-details']").text
        )
        assert (
            self.language
            in driver.find_element(By.XPATH, "//div[@id='languages-details']").text
        )
        assert (
            self.framework
            in driver.find_element(By.XPATH, "//div[@id='framework-details']").text
        )
        assert (
            self.integration
            in driver.find_element(By.XPATH, "//div[@id='integration-details']").text
        )
        assert (
            self.infrastructure
            in driver.find_element(By.XPATH, "//div[@id='infrastructure-details']").text
        )
        assert (
            self.publishing
            in driver.find_element(By.XPATH, "//div[@id='publishing-details']").text
        )

        assert (
            "VSCode"
            in driver.find_element(By.XPATH, "//div[@id='code-editor-details']").text
        )
        assert (
            "Figma"
            in driver.find_element(By.XPATH, "//div[@id='user-interface-details']").text
        )
        assert (
            "Draw"
            in driver.find_element(By.XPATH, "//div[@id='diagram-details']").text
        )
        assert (
            len(
                driver.find_element(
                    By.XPATH, "//div[@id='project-tracking-details']"
                ).text
            )
            > 0
        )
        assert (
            "Confluence"
            in driver.find_element(By.XPATH, "//div[@id='documentation-details']").text
        )
        assert (
            "Slack"
            in driver.find_element(By.XPATH, "//div[@id='communication-details']").text
        )
        assert (
            "Github"
            in driver.find_element(By.XPATH, "//div[@id='collaboration-details']").text
        )
        assert (
            len(
                driver.find_element(
                    By.XPATH, "//div[@id='incident-management-details']"
                ).text
            )
            > 0
        )

    def assert_project_details(self):
        driver = self.driver
        self.click_link(driver, self.project_name)

        assert (
            "test@ons.gov.uk"
            in driver.find_elements(By.CLASS_NAME, "ons-summary__text")[0].text
        )
        assert (
            "testmanager@ons.gov.uk"
            in driver.find_elements(By.CLASS_NAME, "ons-summary__text")[1].text
        )
        assert (
            self.project_name
            and self.project_short_name
            and self.project_desc
            and self.documentation_link
            in driver.find_elements(By.CLASS_NAME, "ons-summary__text")[2].text
        )
        assert (
            "In House"
            or "Outsourced"
            or "Partnership"
            in driver.find_elements(By.CLASS_NAME, "ons-summary__text")[3].text
        )

        assert (
            "Github"
            or "Gitlab"
            or "Bitbucket"
            in driver.find_elements(By.CLASS_NAME, "ons-summary__text")[4].text
        )
        assert (    
            "Test Project"
            in driver.find_elements(By.CLASS_NAME, "ons-summary__text")[5].text
        )
        assert (
            "Automated test dependency description"
            in driver.find_elements(By.CLASS_NAME, "ons-summary__text")[5].text
        )
        assert (
            self.hosting_provider
            or "On-Premises"
            in driver.find_elements(By.CLASS_NAME, "ons-summary__text")[6].text
        )
        assert (
            self.database_provider
            in driver.find_elements(By.CLASS_NAME, "ons-summary__text")[8].text
        )
        # Convert environments to string for comparison
        # assert environment
        expected_envs = environments_to_string(self.environments)
        actual_envs = driver.find_elements(By.CLASS_NAME, "ons-summary__text")[9].text
        assert_environments_equal(expected_envs, actual_envs)

        assert (
            self.framework
            in driver.find_elements(By.CLASS_NAME, "ons-summary__text")[10].text
        )

        assert (
            self.language
            in driver.find_elements(By.CLASS_NAME, "ons-summary__text")[11].text
        )
        assert (
            self.integration
            in driver.find_elements(By.CLASS_NAME, "ons-summary__text")[12].text
        )
        assert (
            self.infrastructure
            in driver.find_elements(By.CLASS_NAME, "ons-summary__text")[13].text
        )
        assert (
            self.publishing
            in driver.find_elements(By.CLASS_NAME, "ons-summary__text")[14].text
        )
        assert (
            "VSCode"
            in driver.find_elements(By.CLASS_NAME, "ons-summary__text")[15].text
        )
        assert (
            "Figma" in driver.find_elements(By.CLASS_NAME, "ons-summary__text")[16].text
        )
        assert (
            "Draw"
            in driver.find_elements(By.CLASS_NAME, "ons-summary__text")[17].text
        )
        assert (
            len(driver.find_elements(By.CLASS_NAME, "ons-summary__text")[18].text) > 0
        )
        assert (
            "Confluence"
            in driver.find_elements(By.CLASS_NAME, "ons-summary__text")[19].text
        )
        assert (
            "Slack" in driver.find_elements(By.CLASS_NAME, "ons-summary__text")[20].text
        )
        assert (
            "Github"
            in driver.find_elements(By.CLASS_NAME, "ons-summary__text")[21].text
        )
        assert (
            len(driver.find_elements(By.CLASS_NAME, "ons-summary__text")[22].text) > 0
        )
        assert (
            "Matchcode"
            in driver.find_elements(By.CLASS_NAME, "ons-summary__text")[23].text
        )
        assert (
            "A code-matching tool"
            in driver.find_elements(By.CLASS_NAME, "ons-summary__text")[23].text
        )

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
        email.send_keys("test@ons.gov.uk")

        choice = self.click_radio(driver, ["grade-6", "grade-7", "seo", "heo", "other"])

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

        choice = self.click_radio(driver, ["grade-6", "grade-7", "seo", "heo", "other"])

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
        programme_name = driver.find_element(By.ID, "programme-name")

        driver.implicitly_wait(10)
        programme_short_name = driver.find_element(By.ID, "programme-short-name")

        driver.implicitly_wait(10)
        project_name = driver.find_element(By.ID, "project-name")

        driver.implicitly_wait(10)
        project_short_name = driver.find_element(By.ID, "project-short-name")

        driver.implicitly_wait(10)
        documentation_link = driver.find_element(By.ID, "documentation-link")

        driver.implicitly_wait(10)
        project_description = driver.find_element(By.ID, "project-description")

        self.wait.until(EC.element_to_be_clickable(programme_name)).click()
        programme_name.send_keys(self.programme_name)

        self.wait.until(EC.element_to_be_clickable(programme_short_name)).click()
        programme_short_name.send_keys(self.programme_short_name)

        self.wait.until(EC.element_to_be_clickable(project_name)).click()
        project_name.send_keys(self.project_name)

        self.wait.until(EC.element_to_be_clickable(project_short_name)).click()
        project_short_name.send_keys(self.project_short_name)

        self.wait.until(EC.element_to_be_clickable(documentation_link)).click()
        documentation_link.send_keys(self.documentation_link)

        self.wait.until(EC.element_to_be_clickable(project_description)).click()
        project_description.send_keys(self.project_desc)

        self.click_link(driver, "Save and continue")

    def complete_project_dependecies(self, driver):
        """Complete project dependencies

        Args:
            driver (webdriver.Firefox): The driver that interacts with the browser
        """
        logging.info("Testing complete_project_dependencies...")
        driver.implicitly_wait(10)

        name_dependency = driver.find_element(By.ID, "project_dependencies-input")
        name_dependency.send_keys("Test Project")
        # Add a description
        desc_input = driver.find_element(By.ID, "project_dependencies_desc-input")
        self.wait.until(EC.element_to_be_clickable(desc_input)).click()
        desc_input.send_keys("Automated test dependency description")
        # Click the Add button
                # the Add button is the searchButton in the macro
        add_btn = driver.find_element(
            By.XPATH, '//button[@class="ons-btn ons-search__btn ons-btn--small"]'
        )
        self.wait.until(EC.element_to_be_clickable(add_btn)).click()
        # Click Save and continue
        self.click_link(driver, "Save and continue")

        self.click_link(driver, "Finish section")

    def complete_tools_details(self, driver):
        """Complete details used on tooling

        Args:
            driver (webdriver.Firefox): The driver that interacts with the browser
        """
        logging.info("Testing complete_tools_details...")
        choice = self.click_radio(driver, ["in-house", "outsourced", "partnership"])

        if choice == "partnership":
            driver.implicitly_wait(10)
            company_name = driver.find_element(By.ID, "partnership")
            self.wait.until(EC.element_to_be_clickable(company_name)).click()
            company_name.send_keys("Example Company")
        elif choice == "outsourced":
            driver.implicitly_wait(10)
            company_name = driver.find_element(By.ID, "outsourced")
            self.wait.until(EC.element_to_be_clickable(company_name)).click()
            company_name.send_keys("Example Company")

        self.click_link(driver, "Save and continue")

        self.click_radio(driver, ["development", "active-support", "unsupported"])

        self.click_link(driver, "Save and continue")

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
        source_control_description = driver.find_element(
            By.ID, "source_control_desc-input"
        )
        self.wait.until(EC.element_to_be_clickable(source_control_description)).click()
        source_control_description.send_keys(self.source_control_description)

        driver.implicitly_wait(10)
        add_btn = driver.find_element(
            By.XPATH, '//button[@class="ons-btn ons-search__btn ons-btn--small"]'
        )
        self.wait.until(EC.element_to_be_clickable(add_btn)).click()

        self.click_link(driver, "Save and continue")

    def complete_hosting(self, driver):
        """Complete details on hosting services

        Args:
            driver (webdriver.Firefox): The driver that interacts with the browser
        """
        logging.info("Testing complete_hosting...")
        choice = self.click_radio(driver, ["on-premises", "cloud", "hybrid"])
        self.click_link(driver, "Save and continue")

        if choice != "On-premises":
            driver.implicitly_wait(10)
            hosting_provider = driver.find_element(By.ID, "hosting-input")
            self.wait.until(EC.element_to_be_clickable(hosting_provider)).click()
            hosting_provider.send_keys(self.hosting_provider)

            driver.implicitly_wait(10)
            add_btn = driver.find_element(
                By.XPATH, '//button[@class="ons-btn ons-search__btn ons-btn--small"]'
            )
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
        add_btn = driver.find_element(
            By.XPATH, '//button[@class="ons-btn ons-search__btn ons-btn--small"]'
        )
        self.wait.until(EC.element_to_be_clickable(add_btn)).click()
        driver.implicitly_wait(10)

        self.click_link(driver, "Save and continue")
    
    def complete_environments(self, driver):
        """Completes the environments section of the project creation process.

        Args:
            driver (webdriver.Chrome): The driver that interacts with the browser
        """
        logging.info("Testing complete_environments...")
        driver.implicitly_wait(10)
        for env in self.environments:  # Iterate through the environments dictionary
            if self.environments[env]:
                environment_selected = driver.find_element(By.ID, env)
                self.wait.until(EC.element_to_be_clickable(environment_selected)).click()
                continue
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
        add_btn = driver.find_element(
            By.XPATH, '//button[@class="ons-btn ons-search__btn ons-btn--small"]'
        )
        self.wait.until(EC.element_to_be_clickable(add_btn)).click()
        driver.implicitly_wait(10)

        driver.implicitly_wait(10)
        main_language = driver.find_element(By.XPATH, '//input[@value="main"]')
        self.wait.until(EC.element_to_be_clickable(main_language)).click()
        language = driver.find_element(By.ID, "languages-input")

        self.wait.until(EC.element_to_be_clickable(language)).click()
        language.send_keys("JavaScript")

        driver.implicitly_wait(10)
        add_btn = driver.find_element(
            By.XPATH, '//button[@class="ons-btn ons-search__btn ons-btn--small"]'
        )
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
        add_btn = driver.find_element(
            By.XPATH, '//button[@class="ons-btn ons-search__btn ons-btn--small"]'
        )
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
        add_btn = driver.find_element(
            By.XPATH, '//button[@class="ons-btn ons-search__btn ons-btn--small"]'
        )
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
        add_btn = driver.find_element(
            By.XPATH, '//button[@class="ons-btn ons-search__btn ons-btn--small"]'
        )
        self.wait.until(EC.element_to_be_clickable(add_btn)).click()
        self.click_link(driver, "Save and continue")

    def complete_publishing(self, driver):
        """Complete details on publishing target used

        Args:
            driver (webdriver.Firefox): The driver that interacts with the browser
        """
        logging.info("Testing complete_publishing...")
        driver.implicitly_wait(10)
        publishing = driver.find_element(By.ID, "publishing-input")

        self.wait.until(EC.element_to_be_clickable(publishing)).click()

        publishing_target = self.publishing
        publishing.send_keys(publishing_target)
        if publishing_target in ("Github", "AWS ECR Private"):
            # If the publishing target is Github or AWS ECR Private, select the main target representing internal target
            add_btn = driver.find_element(
                By.XPATH, '//button[@class="ons-btn ons-search__btn ons-btn--small"]'
                )
            self.wait.until(EC.element_to_be_clickable(add_btn)).click()
            driver.implicitly_wait(10)
            internal_target = driver.find_element(By.XPATH, '//input[@value="main"]')
            self.wait.until(EC.element_to_be_clickable(internal_target)).click()
        else:
            add_btn = driver.find_element(
                By.XPATH, '//button[@class="ons-btn ons-search__btn ons-btn--small"]'
            )
            self.wait.until(EC.element_to_be_clickable(add_btn)).click()
            driver.implicitly_wait(10)
            external_target = driver.find_element(By.XPATH, '//input[@value="other"]')
            self.wait.until(EC.element_to_be_clickable(external_target)).click()
        # Select the main publishing target
        driver.implicitly_wait(10)
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
        add_btn = driver.find_element(
            By.XPATH, '//button[@class="ons-btn ons-search__btn ons-btn--small"]'
        )
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
        add_btn = driver.find_element(
            By.XPATH, '//button[@class="ons-btn ons-search__btn ons-btn--small"]'
        )
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
        add_btn = driver.find_element(
            By.XPATH, '//button[@class="ons-btn ons-search__btn ons-btn--small"]'
        )
        self.wait.until(EC.element_to_be_clickable(add_btn)).click()
        self.click_link(driver, "Save and continue")

    def project_tracking(self, driver):
        """Completes the project tracking section of the project creation process.

        Args:
            driver (webdriver.Firefox): The driver that interacts with the browser
        """
        logging.info("Testing complete_project_tracking...")
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
        add_btn = driver.find_element(
            By.XPATH, '//button[@class="ons-btn ons-search__btn ons-btn--small"]'
        )
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
        add_btn = driver.find_element(
            By.XPATH, '//button[@class="ons-btn ons-search__btn ons-btn--small"]'
        )
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
        add_btn = driver.find_element(
            By.XPATH, '//button[@class="ons-btn ons-search__btn ons-btn--small"]'
        )
        self.wait.until(EC.element_to_be_clickable(add_btn)).click()
        self.click_link(driver, "Save and continue")
    
    def complete_miscellaneous(self, driver):
        """
            Complete the miscellaneous tools section.

        Args:
            driver (webdriver): the Selenium driver
            tools (List[Tuple[str,str]]): list of (name, description) to add
        
        """
        logging.info("Testing complete_miscellaneous...")
        driver.implicitly_wait(10)


        #Find the two inputs
        name_input = driver.find_element(By.ID, "miscellaneous-input")
        desc_input = driver.find_element(By.ID, "miscellaneous_desc-input")

        name_input.send_keys("Matchcode")

        desc_input.send_keys("A code-matching tool")

        # the Add button is the searchButton in the macro
        add_btn = driver.find_element(
            By.XPATH, '//button[@class="ons-btn ons-search__btn ons-btn--small"]'
        )
        self.wait.until(EC.element_to_be_clickable(add_btn)).click()
        
        # 4) Finally click Save and continue
        self.click_link(driver, "Save and continue")
        self.click_link(driver, "Finish section")


    def complete_incident_management(self, driver):
        """Completes the incident management section of the project creation process.

        Args:
            driver (webdriver.Firefox): The driver that interacts with the browser
        """
        logging.info("Testing complete_incident_management...")
        driver.implicitly_wait(10)
        choice = self.click_radio(driver, ["servicenow", "jira", "other"])
        if choice == "other":
            driver.implicitly_wait(10)
            other_input = driver.find_element(By.ID, "other-input")
            self.wait.until(EC.element_to_be_clickable(other_input)).click()
            other_input.send_keys("Zendesk")
        self.click_link(driver, "Save and continue")

def environments_to_string(environments):
    selected = [
        'PREPROD (STAGING)' if env == 'preprod' else env.upper()
        for env, value in environments.items()
        if value is True
    ]
    return ', '.join(selected)


def assert_environments_equal(str1, str2):
    set1 = set(map(str.strip, str1.upper().split(',')))
    set2 = set(map(str.strip, str2.upper().split(',')))
    assert set1 == set2, f"Environments do not match: {set1} != {set2}"


if __name__ == "__main__":
    unittest.main()

import streamlit as st
import requests
import webbrowser
import logging
from bs4 import BeautifulSoup
from datetime import datetime

# Helper function to fetch email details by ID
def fetch_email_by_id(email_id, access_token):
    try:
        logger.info(f"Fetching details for email ID: {email_id}")
        response = requests.get(
            f"http://localhost:3000/email/get-email/{email_id}",
            headers={"Authorization": f"Bearer {access_token}"}
        )
        
        if response.ok:
            return response.json()
        else:
            logger.error(f"Failed to fetch email details: {response.status_code} - {response.text}")
            return None
    except Exception as e:
        logger.error(f"Error fetching email details: {str(e)}")
        return None

# Helper function to display email details
def display_email_details(email_data):
    """Helper function to display email details"""
    logger.debug("Displaying email details")
    
    if not email_data:
        st.error("No email data available")
        return
        
    # Email metadata in a nice card
    with st.expander("📌 Metadata", expanded=True):
        col1, col2 = st.columns(2)
        with col1:
            st.markdown(f"**From:** {email_data.get('from', 'N/A')}")
            st.markdown(f"**Subject:** {email_data.get('subject', 'N/A')}")
            st.markdown(f"**Date:** {email_data.get('date', 'N/A')}")
        with col2:
            st.markdown(f"**To:** {email_data.get('to', 'N/A')}")
            st.markdown(f"**CC:** {email_data.get('cc', 'N/A')}")
            st.markdown(f"**BCC:** {email_data.get('bcc', 'N/A')}")
    
    # Email body with tabs
    st.subheader("✉️ Email Content")
    tab1, tab2, tab3 = st.tabs(["HTML View", "Plain Text", "Raw Data"])
    
    with tab1:
        if email_data.get('body', {}).get('html'):
            logger.debug("Displaying HTML content")
            st.components.v1.html(email_data['body']['html'], height=600, scrolling=True)
        else:
            logger.debug("No HTML content available")
            st.info("No HTML content available")
    
    with tab2:
        if email_data.get('body', {}).get('text'):
            logger.debug("Displaying plain text content")
            st.text_area("Plain Text Content", 
                        email_data['body']['text'], 
                        height=300)
        else:
            logger.debug("No plain text content available")
            st.info("No plain text content available")
    
    with tab3:
        logger.debug("Displaying raw email data")
        st.json(email_data)
    
    # Back button
    if st.button("← Back to Email List"):
        logger.info("User navigated back to email list from details view")
        st.session_state.selected_email = None
        st.rerun()

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('email_viewer.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

# Initialize session state
if 'access_token' not in st.session_state:
    st.session_state.access_token = None
    logger.info("Initialized session state: access_token")
if 'emails' not in st.session_state:
    st.session_state.emails = []
    logger.info("Initialized session state: emails")
if 'selected_email' not in st.session_state:
    st.session_state.selected_email = None
    logger.info("Initialized session state: selected_email")
if 'auth_status' not in st.session_state:
    st.session_state.auth_status = "not_authenticated"
    logger.info("Initialized session state: auth_status")
if 'email_details' not in st.session_state:
    st.session_state.email_details = {}
    logger.info("Initialized session state: email_details")

# Configuration
BACKEND_URL = "http://localhost:4000"
EMAIL_SERVICE_URL = "http://localhost:3000"
logger.info(f"Configured backend URLs - Auth: {BACKEND_URL}, Email: {EMAIL_SERVICE_URL}")

# Custom CSS
st.markdown("""
<style>
    .email-card {
        padding: 15px;
        border-radius: 10px;
        margin-bottom: 10px;
        border-left: 5px solid #4CAF50;
        background-color: #f9f9f9;
    }
    .email-card:hover {
        box-shadow: 0 4px 8px 0 rgba(0,0,0,0.2);
    }
    .header-text { color: #2c3e50; }
    .stButton>button {
        background-color: #4CAF50;
        color: white;
        border-radius: 5px;
        border: none;
        padding: 10px 24px;
    }
    .stButton>button:hover { background-color: #45a049; }
    .email-metadata { font-size: 0.9em; color: #555; }
</style>
""", unsafe_allow_html=True)

# App title
st.title("📧 FoundrMate Email Viewer")
logger.info("Application started")

# Authentication section
st.header("🔐 Authentication")

if st.session_state.auth_status == "authenticated":
    st.success("✅ Successfully authenticated with Google")
    logger.info("User is authenticated")
    
    if st.button("Logout"):
        logger.info("User initiated logout")
        st.session_state.access_token = None
        st.session_state.emails = []
        st.session_state.selected_email = None
        st.session_state.auth_status = "not_authenticated"
        st.session_state.email_details = {}
        logger.info("Session state cleared after logout")
        st.rerun()
        
elif st.session_state.auth_status == "authenticating":
    st.warning("⏳ Authentication in progress...")
    logger.info("Authentication in progress")
    
    with st.spinner("Waiting for authentication to complete..."):
        st.info("After authenticating, please paste your access token below:")
        access_token = st.text_input("Access Token", type="password")
        
        if st.button("Submit Token"):
            if access_token:
                logger.info("Access token submitted, validating...")
                # Test the token with a simple request
                try:
                    logger.debug(f"Making test request to {EMAIL_SERVICE_URL}/email/list-with-token")
                    test_response = requests.post(
                        f"{EMAIL_SERVICE_URL}/email/list-with-token",
                        json={"accessToken": access_token},
                        params={"maxResults": 1}
                    )
                    
                    if test_response.status_code == 200:
                        logger.info("Token validation successful")
                        st.session_state.access_token = access_token
                        st.session_state.auth_status = "authenticated"
                        st.rerun()
                    else:
                        error_msg = f"Token validation failed: {test_response.status_code}"
                        logger.error(error_msg)
                        st.error(error_msg)
                except Exception as e:
                    error_msg = f"Connection error during token validation: {str(e)}"
                    logger.error(error_msg, exc_info=True)
                    st.error(error_msg)
            else:
                logger.warning("Empty access token submitted")
                st.error("Please enter a valid access token")

else:
    st.info("Please authenticate with your Google account to access your emails")
    logger.info("User not authenticated, showing auth prompt")
    
    if st.button("Connect with Google"):
        logger.info("User clicked Connect with Google")
        auth_url = f"{BACKEND_URL}/auth/google"
        logger.debug(f"Opening auth URL: {auth_url}")
        webbrowser.open_new_tab(auth_url)
        st.session_state.auth_status = "authenticating"
        logger.info("Set auth_status to authenticating")
        st.rerun()

# Email listing section
if st.session_state.auth_status == "authenticated":
    st.header("📬 Your Emails")
    logger.info("Displaying email listing section")
    
    # Email search and filter options
    with st.expander("🔍 Search and Filter Options", expanded=True):
        col1, col2 = st.columns(2)
        with col1:
            max_results = st.number_input("Max Results", min_value=1, max_value=100, value=10)
            include_spam = st.checkbox("Include Spam/Trash")
        with col2:
            search_query = st.text_input("Search Query")
            label_filter = st.text_input("Label IDs (comma-separated)")
    
    # Fetch emails button
    if st.button("🔄 Fetch Emails") or not st.session_state.emails:
        logger.info("Fetching emails initiated")
        with st.spinner("Fetching your emails..."):
            try:
                params = {
                    "maxResults": max_results,
                    "includeSpamTrash": include_spam
                }
                if search_query:
                    params["q"] = search_query
                    logger.debug(f"Added search query: {search_query}")
                if label_filter:
                    params["labelIds"] = label_filter
                    logger.debug(f"Added label filter: {label_filter}")
                
                headers = {"Authorization": f"Bearer {st.session_state.access_token}"}
                logger.debug(f"Making request to {EMAIL_SERVICE_URL}/email/list-with-token with params: {params}")
                
                response = requests.post(
                    f"{EMAIL_SERVICE_URL}/email/list-with-token",
                    json={"accessToken": st.session_state.access_token},
                    params=params
                )
                
                if response.status_code == 200:
                    data = response.json()
                    logger.debug(f"Received response: {data}")
                    
                    emails = []
                    if 'messages' in data:
                        # The API returns message IDs, not full email content
                        emails = data['messages']
                        logger.debug(f"Found {len(emails)} messages in response")
                    elif 'emails' in data:
                        emails = data['emails']
                    elif isinstance(data, list):
                        emails = data
                        
                    if emails and len(emails) > 0:
                        st.session_state.emails = emails
                        logger.info(f"Successfully fetched {len(emails)} emails")
                        st.success(f"✅ Found {len(emails)} emails")
                    else:
                        logger.warning("No emails found matching criteria")
                        st.warning("No emails found matching your criteria")
                        st.session_state.emails = []
                else:
                    error_msg = f"Error fetching emails: {response.status_code} - {response.text}"
                    logger.error(error_msg)
                    st.error(error_msg)
            except Exception as e:
                error_msg = f"Error fetching emails: {str(e)}"
                logger.error(error_msg, exc_info=True)
                st.error(error_msg)
    
    # Display email list in a more attractive way
    if st.session_state.emails:
        # Check if emails are in the simplified format (just IDs)
        if st.session_state.emails and all(isinstance(email, dict) and 'id' in email and len(email.keys()) <= 2 for email in st.session_state.emails):
            st.info("Retrieved email IDs successfully. Please use the 'Get Email Details' button to view full content.")
            
            # Create a simple display for the email IDs
            for i, email in enumerate(st.session_state.emails):
                email_id = email.get('id', '')
                thread_id = email.get('threadId', '')
                if st.button(f"Get Email Details #{i+1} (ID: {email_id[:8]}...)"):
                    st.session_state.selected_email = email_id
                    st.rerun()
        st.subheader("📋 Email List")
        logger.info(f"Displaying list of {len(st.session_state.emails)} emails")
        
        for i, email in enumerate(st.session_state.emails):
            email_id = email.get("id")
            thread_id = email.get("threadId", "N/A")
            logger.debug(f"Displaying email {i+1} - ID: {email_id}, Thread: {thread_id}")
            
            # Create a card for each email
            with st.container():
                st.markdown(f"""
                <div class="email-card">
                    <h4>Email {i+1}</h4>
                    <div class="email-metadata">
                        <p><strong>ID:</strong> {email_id}</p>
                        <p><strong>Thread ID:</strong> {thread_id}</p>
                    </div>
                </div>
                """, unsafe_allow_html=True)
                
                if st.button(f"View Details", key=f"view_{email_id}"):
                    logger.info(f"User selected email ID: {email_id}")
                    st.session_state.selected_email = email_id
                    st.rerun()
        
        st.markdown("---")
    
    # Display selected email with better formatting
    if st.session_state.selected_email:
        st.header("📄 Email Details")
        logger.info(f"Displaying details for email ID: {st.session_state.selected_email}")
        
        # Check if we already have the details for this email
        if st.session_state.selected_email in st.session_state.email_details:
            logger.info(f"Using cached details for email ID: {st.session_state.selected_email}")
            email_data = st.session_state.email_details[st.session_state.selected_email]
        else:
            logger.info(f"Fetching details for email ID: {st.session_state.selected_email}")
            # Fetch the full email details
            email_data = fetch_email_by_id(st.session_state.selected_email, st.session_state.access_token)
            if email_data:
                st.session_state.email_details[st.session_state.selected_email] = email_data
            else:
                st.error("Failed to fetch email details. Please try again.")
                email_data = {}
        
        display_email_details(email_data)


# Sidebar with instructions
with st.sidebar:
    st.markdown("## ℹ️ Instructions")
    st.markdown("""
    1. Click **Connect with Google**
    2. Authenticate with your Google account
    3. Paste the access token when redirected back
    4. Use the filters to find specific emails
    5. Click on any email to view its details
    """)
    
    if st.session_state.auth_status == "authenticated":
        st.success("Logged In")
        st.markdown(f"**Emails loaded:** {len(st.session_state.emails)}")
    else:
        st.warning("Not Logged In")
    
    st.markdown("---")
    st.markdown("### 🔒 Security Note")
    st.markdown("""
    - Your access token is stored only in your browser
    - No data is saved on our servers
    - Always logout when done
    """)

# Add some empty space at the bottom
for _ in range(5):
    st.write("")

logger.info("Application rendering complete")

def fetch_emails(access_token: str, max_results: int = 10):
    try:
        response = requests.post(
            f"{EMAIL_SERVICE_URL}/email/list-with-token",
            json={
                "accessToken": access_token,
                "maxResults": max_results
            }
        )
        if response.ok:
            data = response.json()
            if 'messages' in data:
                return data['messages']
            elif 'emails' in data:
                return data['emails']
            elif 'success' in data and data.get('messages'):
                return data.get('messages', [])
            else:
                return data if isinstance(data, list) else []
        else:
            st.error("Failed to fetch emails")
            logger.error(f"Email fetch failed: {response.status_code} - {response.text}")
            return []
    except Exception as e:
        logger.error(f"Error fetching emails: {str(e)}")
        return []
import os
import urllib.request
import feedparser
from flask import Flask, jsonify, render_template
from bs4 import BeautifulSoup

app = Flask(__name__)

FEED_URL = "https://docs.cloud.google.com/feeds/bigquery-release-notes.xml"

def parse_entry_html(html_content):
    """
    Parses BigQuery release notes HTML content and splits them by h3 tags
    representing update types (Feature, Issue, Deprecation, Changed, Fixed, etc.)
    """
    if not html_content:
        return []
        
    soup = BeautifulSoup(html_content, 'html.parser')
    items = []
    
    current_type = "Update"
    current_content = []
    
    # Traverse through top-level elements of the parsed HTML
    for child in soup.contents:
        # Check if this element is an h3 header (which BigQuery notes use to categorize)
        if child.name == 'h3':
            # Save the previous item if we had accumulated content
            if current_content:
                html_snippet = "".join([str(x) for x in current_content]).strip()
                text_snippet = BeautifulSoup(html_snippet, 'html.parser').get_text(separator=' ').strip()
                items.append({
                    "type": current_type,
                    "content_html": html_snippet,
                    "content_text": text_snippet
                })
                current_content = []
            current_type = child.get_text().strip()
        elif child.name is not None or (isinstance(child, str) and child.strip()):
            current_content.append(child)
            
    # Save the last accumulated item
    if current_content:
        html_snippet = "".join([str(x) for x in current_content]).strip()
        text_snippet = BeautifulSoup(html_snippet, 'html.parser').get_text(separator=' ').strip()
        items.append({
            "type": current_type,
            "content_html": html_snippet,
            "content_text": text_snippet
        })
        
    return items

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/notes')
def get_release_notes():
    try:
        # Fetch and parse the feed
        feed = feedparser.parse(FEED_URL)
        
        # Check if feedparser encountered parsing errors or didn't fetch entries
        if feed.bozo and not feed.entries:
            return jsonify({
                "status": "error",
                "message": f"Failed to parse feed. Technical reason: {str(feed.bozo_exception)}"
            }), 500
            
        parsed_entries = []
        
        for entry in feed.entries:
            # Extract content html
            content_html = ""
            if 'content' in entry and len(entry.content) > 0:
                content_html = entry.content[0].value
            elif 'summary' in entry:
                content_html = entry.summary
                
            # Parse the html into separate items
            items = parse_entry_html(content_html)
            
            # Format and append
            parsed_entries.append({
                "id": entry.get('id', entry.get('link', '')),
                "title": entry.get('title', 'Unknown Date'),
                "updated": entry.get('updated', ''),
                "link": entry.get('link', ''),
                "items": items
            })
            
        return jsonify({
            "status": "success",
            "feed_title": feed.feed.get('title', 'BigQuery - Release Notes'),
            "feed_link": feed.feed.get('link', 'https://cloud.google.com/bigquery/docs/release-notes'),
            "updated": feed.feed.get('updated', ''),
            "entries": parsed_entries
        })
        
    except Exception as e:
        return jsonify({
            "status": "error",
            "message": f"An error occurred while fetching release notes: {str(e)}"
        }), 500

if __name__ == '__main__':
    # Running on port 5000 by default
    app.run(debug=True, port=5000)

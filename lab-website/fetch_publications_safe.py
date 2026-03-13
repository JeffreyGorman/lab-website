#!/usr/bin/env python3
"""
Safe Google Scholar to Hugo Publications Generator
Preserves manual content and only updates the auto-generated section
"""

from scholarly import scholarly, ProxyGenerator
import time
import re

# Your Google Scholar ID
SCHOLAR_ID = "dAKlZOAAAAAJ"

# Output file path
OUTPUT_FILE = "content/publications.md"

# Markers for the auto-generated section
START_MARKER = "<!-- AUTO-GENERATED START - Do not edit below this line -->"
END_MARKER = "<!-- AUTO-GENERATED END -->"

def setup_proxy():
    """Setup proxy to avoid Google Scholar blocking"""
    try:
        pg = ProxyGenerator()
        pg.FreeProxies()
        scholarly.use_proxy(pg)
        print("✓ Proxy setup successful")
        return True
    except Exception as e:
        print(f"⚠ Proxy setup failed: {e}")
        print("Continuing without proxy (may be rate limited)")
        return False

def fetch_publications(scholar_id):
    """Fetch all publications for a given Google Scholar ID"""
    print(f"Fetching publications for Scholar ID: {scholar_id}")
    
    try:
        # Get author profile
        author = scholarly.search_author_id(scholar_id)
        author = scholarly.fill(author, sections=['publications'])
        
        print(f"✓ Found author: {author['name']}")
        print(f"✓ Total publications: {len(author['publications'])}")
        
        # Fetch detailed info for each publication
        publications = []
        for i, pub in enumerate(author['publications'], 1):
            try:
                print(f"  Fetching publication {i}/{len(author['publications'])}")
                filled_pub = scholarly.fill(pub)
                publications.append(filled_pub)
                time.sleep(1)  # Be nice to Google Scholar
            except Exception as e:
                print(f"  ⚠ Error fetching publication {i}: {e}")
                publications.append(pub)  # Use unfilled version
        
        return publications
    
    except Exception as e:
        print(f"✗ Error fetching publications: {e}")
        return []

def shorten_author_names(authors_str):
    """Convert author names to initials (e.g., 'Jeffrey Gorman' to 'J. Gorman')"""
    if not authors_str:
        return "Unknown authors"
    
    # Split by 'and' or commas
    authors = authors_str.replace(' and ', ', ').split(', ')
    
    shortened = []
    for author in authors:
        author = author.strip()
        if not author:
            continue
        
        # Split into parts (assuming "First Middle Last" format)
        parts = author.split()
        if len(parts) == 0:
            continue
        elif len(parts) == 1:
            # Just last name
            shortened.append(parts[0])
        else:
            # First name(s) to initials, keep last name
            initials = [f"{p[0]}." for p in parts[:-1]]
            shortened.append(" ".join(initials) + " " + parts[-1])
    
    return ", ".join(shortened)

def format_publication_markdown(pub):
    """Format a single publication in markdown"""
    # Extract data with fallbacks
    title = pub.get('bib', {}).get('title', 'Untitled')
    authors = pub.get('bib', {}).get('author', 'Unknown authors')
    year = pub.get('bib', {}).get('pub_year', 'n.d.')
    venue = pub.get('bib', {}).get('venue', pub.get('bib', {}).get('journal', ''))
    volume = pub.get('bib', {}).get('volume', '')
    pages = pub.get('bib', {}).get('pages', '')
    pub_url = pub.get('pub_url', pub.get('eprint_url', ''))
    
    # Shorten author names
    authors_short = shorten_author_names(authors)
    
    # Build citation string
    citation = f"{authors_short}, {title}, "
    
    if venue:
        citation += f"*{venue}*"
    
    citation += f", {year}"
    
    if volume:
        citation += f", **{volume}**"
    
    if pages:
        citation += f", {pages}"
    
    citation += "."
    
    # Add link if available
    if pub_url:
        citation += f" [[Paper]]({pub_url})"
    
    return citation + "\n\n"

def generate_publications_content(publications):
    """Generate just the publications list content"""
    
    # Sort by year (most recent first)
    publications.sort(
        key=lambda x: int(x.get('bib', {}).get('pub_year', 0)), 
        reverse=True
    )
    
    # Group publications by year
    pubs_by_year = {}
    for pub in publications:
        year = pub.get('bib', {}).get('pub_year', 'Unknown')
        if year not in pubs_by_year:
            pubs_by_year[year] = []
        pubs_by_year[year].append(pub)
    
    # Generate markdown content
    content = f"{START_MARKER}\n\n"
    
    # Add publications grouped by year
    for year in sorted(pubs_by_year.keys(), reverse=True):
        content += f"## {year}\n\n"
        for pub in pubs_by_year[year]:
            content += format_publication_markdown(pub)
    
    content += f"{END_MARKER}\n"
    
    return content

def update_publications_file(publications, output_file):
    """Update the publications file, preserving manual content"""
    
    new_content = generate_publications_content(publications)
    
    try:
        # Try to read existing file
        try:
            with open(output_file, 'r', encoding='utf-8') as f:
                existing_content = f.read()
        except FileNotFoundError:
            # File doesn't exist, create with default header
            existing_content = """---
title: "Publications"
draft: false
---

Add your custom introduction text here. Everything below the marker will be auto-updated.

"""
        
        # Check if markers exist
        if START_MARKER in existing_content and END_MARKER in existing_content:
            # Replace content between markers
            pattern = re.escape(START_MARKER) + r'.*?' + re.escape(END_MARKER)
            updated_content = re.sub(
                pattern, 
                new_content.strip(), 
                existing_content, 
                flags=re.DOTALL
            )
            print("✓ Updated existing auto-generated section")
        else:
            # No markers found, append to end
            updated_content = existing_content.rstrip() + "\n\n" + new_content
            print("✓ Added auto-generated section to end of file")
        
        # Write updated content
        with open(output_file, 'w', encoding='utf-8') as f:
            f.write(updated_content)
        
        print(f"✓ Successfully updated {output_file} with {len(publications)} publications")
        print("\n⚠ Your manual content has been preserved!")
        
    except Exception as e:
        print(f"\n✗ Error updating file: {e}")

def main():
    print("=" * 60)
    print("Safe Google Scholar to Hugo Publications Generator")
    print("=" * 60)
    
    # Setup proxy (optional but recommended)
    setup_proxy()
    
    # Fetch publications
    publications = fetch_publications(SCHOLAR_ID)
    
    if not publications:
        print("\n✗ No publications found. Please check your Scholar ID.")
        return
    
    # Update Hugo file (preserving manual content)
    update_publications_file(publications, OUTPUT_FILE)
    
    print("\n✓ Done! Your publications page is ready.")
    print(f"  Preview with: hugo server")

if __name__ == "__main__":
    main()

#!/usr/bin/env python3
"""
Google Scholar to Hugo Publications Generator
Fetches publications from Google Scholar and formats them for Hugo
"""

from scholarly import scholarly, ProxyGenerator
import time

# Your Google Scholar ID
SCHOLAR_ID = "dAKlZOAAAAAJ"

# Output file path
OUTPUT_FILE = "content/publications.md"

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

def format_publication_markdown(pub):
    """Format a single publication in markdown"""
    # Extract data with fallbacks
    title = pub.get('bib', {}).get('title', 'Untitled')
    authors = pub.get('bib', {}).get('author', 'Unknown authors')
    year = pub.get('bib', {}).get('pub_year', 'n.d.')
    venue = pub.get('bib', {}).get('venue', pub.get('bib', {}).get('journal', ''))
    citations = pub.get('num_citations', 0)
    pub_url = pub.get('pub_url', pub.get('eprint_url', ''))
    
    # Format the markdown
    md = f"### {title}\n\n"
    md += f"**{authors}**  \n"
    
    if venue:
        md += f"*{venue}*, {year}  \n"
    else:
        md += f"{year}  \n"
    
    if pub_url:
        md += f"[Paper]({pub_url})"
        if citations > 0:
            md += f" · Citations: {citations}"
    elif citations > 0:
        md += f"Citations: {citations}"
    
    md += "\n\n"
    
    return md

def generate_hugo_file(publications, output_file):
    """Generate the Hugo markdown file with all publications"""
    
    # Sort by year (most recent first)
    publications.sort(
        key=lambda x: int(x.get('bib', {}).get('pub_year', 0)), 
        reverse=True
    )
    
    # Generate markdown content
    content = """---
title: "Publications"
draft: false
---

## Journal Articles and Conference Papers

"""
    
    for pub in publications:
        content += format_publication_markdown(pub)
    
    # Write to file
    try:
        with open(output_file, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"\n✓ Successfully wrote {len(publications)} publications to {output_file}")
    except Exception as e:
        print(f"\n✗ Error writing file: {e}")

def main():
    print("=" * 60)
    print("Google Scholar to Hugo Publications Generator")
    print("=" * 60)
    
    # Setup proxy (optional but recommended)
    setup_proxy()
    
    # Fetch publications
    publications = fetch_publications(SCHOLAR_ID)
    
    if not publications:
        print("\n✗ No publications found. Please check your Scholar ID.")
        return
    
    # Generate Hugo file
    generate_hugo_file(publications, OUTPUT_FILE)
    
    print("\n✓ Done! Your publications page is ready.")
    print(f"  Preview with: hugo server")

if __name__ == "__main__":
    main()

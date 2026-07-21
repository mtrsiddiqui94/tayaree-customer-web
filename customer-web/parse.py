import re
import os
import sys

def kebab_to_camel(kebab_str):
    parts = kebab_str.split('-')
    return parts[0] + ''.join(x.title() for x in parts[1:])

def process_html_file(html_file, output_tsx, output_css):
    with open(html_file, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Extract style block
    style_match = re.search(r'<style>(.*?)</style>', content, re.DOTALL)
    if style_match:
        css_content = style_match.group(1)
    else:
        css_content = ''

    # Find all class names in CSS
    class_pattern = re.compile(r'\.([a-zA-Z0-9_-]+)')
    classes = set(class_pattern.findall(css_content))
    
    # Also find classes in HTML
    html_class_pattern = re.compile(r'class="([^"]+)"')
    for m in html_class_pattern.finditer(content):
        for c in m.group(1).split():
            classes.add(c)
            
    # Process CSS content: replace .kebab-case with .camelCase
    processed_css = css_content
    for c in sorted(classes, key=len, reverse=True):
        if '-' in c:
            camel = kebab_to_camel(c)
            processed_css = re.sub(r'\.' + re.escape(c) + r'(?=[^a-zA-Z0-9_-])', '.' + camel, processed_css)
            
    # Write CSS module
    with open(output_css, 'w', encoding='utf-8') as f:
        f.write(processed_css.strip())
        
    print(f"Written CSS to {output_css}")

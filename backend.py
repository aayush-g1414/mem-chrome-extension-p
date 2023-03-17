import requests
import os
import openai
from bs4 import BeautifulSoup
from flask import Flask, request, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}})

def getText(url):
    ''' Returns the text of a webpage given a URL

    Parameters:
    url (str): URL of the webpage to be searched

    Returns:
    text (str): Text of the webpage

    '''

    # Get the text from the URL using BeautifulSoup
    soup = BeautifulSoup(requests.get(url).text, "html.parser")

    # Get the text but remove the tags
    text = soup.get_text()

    # If the crawler gets to a page that requires JavaScript, it will stop the crawl
    if ("You need to enable JavaScript to run this app." in text):
        return "Unable to parse page " + url + " due to JavaScript being required"
    

    return text

def getStructuredKnowledge(url):
    ''' Returns the parsed notes of a webpage given a URL

    Parameters:
    url (str): URL of the webpage to be searched
    
    Returns:
    text (str): structured notes of the webpage

    '''
    info = getText(url)

    # parse information through gpt3.5
    openai.api_key = "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"
    prompt = "Parse and Transform the following information into notes: " + info
    completion = openai.ChatCompletion.create(
        model="gpt-3.5-turbo",
        temperature=0.2,
        max_tokens=1024,
        messages=[
            {"role" : "system", "content": "You parse and transform information I provide to you so it can be used as notes"}, {"role": "user" , "content": prompt}
        ]
    )

    return completion.choices[0].message.content

def getTags(url):
    ''' Returns the tags of a webpage given a URL

    Parameters:
    url (str): URL of the webpage to be crawled
    
    Returns:
    text (str): tags of the webpage

    '''

    info = getText(url)

    # collect tags through gpt3.5
    openai.api_key = "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"
    prompt = "Find a few useful tags in this information and add a hashtag infront of each one: " + info
    completion = openai.ChatCompletion.create(
        model="gpt-3.5-turbo",
        temperature=0.2,
        max_tokens=1024,
        messages=[
            {"role" : "system", "content": "Your role is to create a few tags summing up the information provided and adding a hashtag infront of the few tags created"}, {"role": "user" , "content": prompt}
        ]
    )

    return completion.choices[0].message.content

@app.route('/api/parse', methods=['POST'])
def parse():
    """POST request to parse a webpage

    Returns:
    JSON: structured notes of the webpage
    """
    url = request.json['url']
    temp = getStructuredKnowledge(url)
    return jsonify({'result': temp})

@app.route('/api/tags', methods=['POST'])
def tags():
    """POST request to get tags of a webpage

    Returns:
    JSON: tags of the webpage
    """
    url = request.json['url']
    temp = getTags(url)
    return jsonify({'result': temp})

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(debug=True, host="0.0.0.0", port=port)
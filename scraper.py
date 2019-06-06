

from goose3 import Goose

def scraper():
    
    url = input()
    g = Goose()
    article = g.extract(url=url)   
    s = [article.title, article.meta_description, article.cleaned_text, article.meta_keywords, \
           article.domain, article.publish_date, article.tweets, article.links]
    import json
    with open('result.json', 'w') as fp:
        json.dump(s, fp)
    




           

 
    
    

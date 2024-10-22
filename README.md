# news-extension

Browser extension for analyzing news article bias and source reliability. Using data and research from public MIT CSAIL and QCRI code and other projects on machine learning for fact-checking, with our own personalized tweaks, this extension is meant to give each shared news article a "reliability score."

## Reliability Weighting Criteria
| Metric              | Weight        |
| --------------------|:-------------:| 
| Source Reputation   | 1.0           |  

## References

"Predicting Factuality of Reporting and Bias of News Media Sources" https://arxiv.org/pdf/1810.01765.pdf

GitHub link for the above MIT CSAIL and QCRI paper's data: https://github.com/ramybaly/News-Media-Reliability/

BS-Detector GitLab: https://gitlab.com/bs-detector/bs-detector

"Sampling the News Producers: A Large News and Feature Data Set for the Study of the Complex Media Landscape"https://arxiv.org/pdf/1803.10124.pdf

"Language Features for News" Github cited in Horne: https://github.com/BenjaminDHorne/Language-Features-for-News

NELA Dataset (Harvard Dataverse) (Does not work on the Wifi for some reason): https://dataverse.harvard.edu/dataset.xhtml?persistentId=doi:10.7910/DVN/ULHLCB

NELA Toolkit: http://nelatoolkit.science/credibilitytoolkit

NELA Article (Horne et all): http://homepages.rpi.edu/~horneb/WWW18_Horne_Demo.pdf

python-goose dataset: https://github.com/grangier/python-goose/tree/develop/goose

Goose3 quickstart guide: https://goose3.readthedocs.io/en/latest/quickstart.html

Claimbuster dataset: https://idir.uta.edu/claimbuster/

MIT/QRIC Corpus list: https://github.com/ramybaly/News-Media-Reliability/blob/master/data/corpus.csv

VADER article: https://www.aaai.org/ocs/index.php/ICWSM/ICWSM14/paper/download/8109/8122

Interview questions obtained for Fandango Project and PolitiFact: ask Amanda 

Goose3 code configuration: https://github.com/amlmike/web-scraper

Parser: https://www.npmjs.com/package/article-parser
see the file article-parser.js for the code easily accessble

NELA Github: https://github.com/BenjaminDHorne/The-NELA-Toolkit
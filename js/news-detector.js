watsonUrl = ('https://gateway.watsonplatform.net/tone-analyzer/api');
testStr = ('Product sales have been disappointing for the past three quarters.');

// If no browser object, check for chrome
if (typeof chrome === 'undefined' && typeof browser !== 'undefined') {
    chrome = browser;
}

//Class constructor with variable initialize
function NewsDetector() {

    'use strict';

    this.newsId = null;
    this.currentSite = null;
    this.currentUrl = '';
    this.data = [];
    this.dataType = '';
    this.debugActive = false;
    this.expandLinks = null;
    this.expanded = {};
    this.flagState = 0; // 0 initial, 1 open, -1 hidden
    this.firstLoad = true;
    
    this.score = 0;
    this.sentiment = '';

    this.shorts = [];
    this.shortUrls = [];
    this.siteId = '';
    this.warnMessage = '';
    this.mutationObserver = {};
    this.windowUrl = window.location.hostname;
    this.observerRoot = null;
    this.observerFilter = null;
    this.ownHostRegExp = new RegExp( window.location.host );
    this.lfbRegExp = new RegExp( /^https?:\/\/l\.facebook\.com\/l\.php\?u=([^&]+)/);
}


NewsDetector.prototype = {

    constructor: NewsDetector,

    //Log debug messages, if the debug flag is set
    debug: function () {

        'use strict';

        if (this.debugActive === true) {
            console.debug.apply(null,[' News Detector '].concat(arguments));
        }
    },

 
    // Asynchronous loading function
    asynch: function (thisFunc, callback) {

        'use strict';

        setTimeout(function () {
            thisFunc();
            if (typeof callback === 'function') {
                callback();
            }
        }, 10);
    },

    // Check if a string is valid JSON
    isJson: function (string) {

        'use strict';

        try {
            JSON.parse(string);
        } catch (e) {
            console.error('Given string is no valid JSON');
            return false;
        }
        return true;
    },
    
    // Strip urls down to hostname
    cleanUrl: function (url) {

        'use strict';

        var
            testLink = '',
            thisUrl = '';

        if (this.siteId === 'facebook') {
            testLink = decodeURIComponent(url).substring(0, 30);

            if (testLink === 'https://l.facebook.com/l.php?u=' || testLink === 'http://l.facebook.com/l.php?u=') {
                thisUrl = decodeURIComponent(url).substring(30).split('&h=', 1);
                url = thisUrl;
            }

        }

        return url2Domain(url);
    },

    // Identify current site
    identifySite: function () {

        'use strict';

        // currentSite looks for the currentUrl (window.location.hostname) in the JSON data file
        this.currentUrl = this.cleanUrl(this.windowUrl);

        if (self === top) {
            switch (this.currentUrl) {
            case 'www.facebook.com':
            case 'facebook.com':
                this.siteId = 'facebook';
                break;
            /* case 'twitter.com':
                this.siteId = 'twitter';
                break;
            */
            default:
                this.siteId = 'none';
                // Try to find the site in data
                this.currentSite = this.data[this.currentUrl];
                if (typeof this.currentSite === 'undefined') {
                    // Check for 'www.' prefix
                    this.currentSite = this.data['www.' + this.currentUrl];
                    if (typeof this.currentSite === 'undefined') {
                        // For now, consider it not in the list
                        this.currentSite = null;
                    }
                }
                if (this.currentSite) {
                    this.siteId = 'badlink';
                    this.dataType = this.currentSite.type;
                }
                break;
            }
        }

        this.debug('this.currentUrl: ', this.currentUrl);
        this.debug('this.currentSite: ', this.currentSite);
        this.debug('this.siteId: ', this.siteId);
        this.debug('this.dataType: ', this.dataType);

    },

    // Expand short urls and append to anchor tags
    getLinks: function () {

        'use strict';

        $.each(this.shorts, function () {
            var
                shortLink = 'a[href*="' + $(this) + '"]';

            $(shortLink).each(function () {
                newsd.toExpand.push($(this).attr('href'));
            });
        });
    },

    // Expanding short urls
    processLinks: function () {

        'use strict';

        if (this.toExpand) {

            this.debug('this.toExpand[]: ', this.toExpand);

            chrome.runtime.sendMessage(null, {
                'operation': 'expandLinks',
                'shortLinks': this.toExpand.toString()
            }, null, function (response) {
                this.debug('Expanded Links: ', response);

                if (this.isJson(response)) {
                    this.expanded = JSON.parse(response);
                    $.each(this.expanded, function (key, value) {
                        $('a[href="' + value.requestedURL + '"]').attr('longurl', value.resolvedURL);
                    });
                } else {
                    this.debug('Could not expand shortened link');
                    this.debug('Response: ' + response);
                }
            });
        }
    },



    // Generate warning message for a given url
    warningMsg: function () {

        'use strict';

        var classType = '';

        switch (this.dataType) {
        case 'bias':
            classType = 'Extreme Bias';
            break;
        case 'conspiracy':
            classType = 'Conspiracy Theory';
            break;
        case 'fake':
            classType = 'Fake News';
            break;
        case 'junksci':
            classType = 'Junk Science';
            break;
        case 'rumors':
            classType = 'Rumor Mill';
            break;
        case 'satire':
            classType = 'Satire';
            break;
        case 'state':
            classType = 'State News Source';
            break;
        case 'hate':
            classType = 'Hate Group';
            break;
        case 'clickbait':
            classType = 'Clickbait';
            break;
        case 'caution':
            classType = 'Caution';
            break;
        case 'test':
            classType = 'Test';
            break;
        case 'known':
            classType = 'Known';
        break;
        default:
            classType = 'Classification Pending';
            break;
        }


        if (this.dataType === 'caution') {
            this.warnMessage = '⚠️ <b>Caution: Source may be reliable but contents require further verification.</b>';
        } else if (this.dataType === 'known') {
            this.warnMessage = '<b>This is generally considered a reliable source.</b>';
        } else {
            this.warnMessage = '<b>This may not be a reliable source.</b>';
        }

        this.debug('this.warnMessage: ', this.warnMessage);
    },


    /* Flag entire site
    flagSite: function () {

        'use strict';

        var navs = $('nav, #nav, #navigation, #navmenu');

        if (this.flagState !== 0) {
            return;
        }

        this.flagState = 1;
        this.warningMsg();

        if ($(navs)) {
            $(navs).first().addClass('news-alert-shift');
        } else {
            $('body').addClass('news-alert-shift');
        }

        if (this.dataType === 'caution') {
            $('body').prepend('<div class="news-alert news-caution"></div>');
        } else if (this.dataType === 'known') {
            $('body').prepend('<div class="known-news-alert"></div>');
        } else {
            $('body').prepend('<div class="news-alert"></div>');
        }

        $('.news-alert').append('<div class="news-alert-close">✕</div>');
        $('.news-alert').append('<span>' + this.warnMessage + '</span>');

        $('.news-alert-close').on('click', function () {
            $(navs).first().removeClass('news-alert-shift');
            $('body').removeClass('news-alert-shift');
            $('.news-alert').remove();
        });
    }, */

    // Make flags visible
    showFlag: function () {

        'use strict';

        this.flagState = 1;
        $('.news-alert').show();

    },

    // Make flags invisible
    hideFlag: function () {

        'use strict';

        this.flagState = -1;
        $('.news-alert').hide();

    },


     //Detect tone via Watson API
     /* getTone: async function(url) {
        var watsonAPI = 'https://gateway.watsonplatform.net/tone-analyzer/api/v1/analyze?version=2018-11-16/';
        var apikey = 'ppuuYoF4q67GA-repblvIDPvqC7de4E36htroVZ-0Jqg'
        fetch(`${watsonAPI}`, {
            //body: '{"url": \"https://www.ft.com/content/6da72076-8133-11e9-b592-5fe435b57a3b\",\n\"features\": {\n\"sentiment\": {},\n\"categories\": {},\n\"concepts\": {},\n\"entities\": {},\n\"keywords\": {}\n}\n}',
            headers: {
                "apikey": 'ppuuYoF4q67GA-repblvIDPvqC7de4E36htroVZ-0Jqg',
                "Content-Type": "application/json"
            },
            method: 'POST'
        }
        ).then(r => r.text()).then(result => {
            // Result now contains the response text, do what you want...
            console.log(result);
        })
    }, */

    getTone: function(url) {
        var watsonAPI = 'https://gateway.watsonplatform.net/tone-analyzer/api/v1/analyze?version=2018-11-16/';
        var apikey = 'ppuuYoF4q67GA-repblvIDPvqC7de4E36htroVZ-0Jqg'
        fetch("https://gateway.watsonplatform.net/tone-analyzer/api/v3/tone?version=2017-09-21&text=Team,%20I%20know%20that%20times%20are%20tough20Product%20sales%20have%20been%20disappointing%20for%20the%20past%20three%20quarters.%20We%20have%20a%20competitive%20product,%20but%20we%20need%20to%20do%20a%20better%20job%20of%20selling%20it", {
            headers: {
                Authorization: "Basic YXBpa2V5OnBwdXVZb0Y0cTY3R0EtcmVwYmx2SURQdnFDN2RlNEUzNmh0cm9WWi0wSnFn"
            }
        }
        ).then(r => r.text()).then(result => {
            // Result now contains the response text, do what you want...
            console.log(result);
        })
    },

    // Get the hostname of a given element's link
    getHost: function ($element) {

        'use strict';

        var thisUrl = '';
        if ($element.attr('data-expanded-url') !== null && $element.attr('data-expanded-url') !== undefined) {
            thisUrl = $element.attr('data-expanded-url');
            
            //!!!
            // console.log(thisUrl);
            this.getTone(thisUrl);
            
        } else {
            thisUrl = $element.attr('href');
        }
        if (thisUrl !== null && thisUrl !== undefined) {
            thisUrl = this.cleanUrl(thisUrl);
        }

        return thisUrl;
    },


    // Target links
    targetLinks: function () {

        'use strict';

        // find and label external links
        $('a[href]:not([href^="#"]), a[data-expanded-url]').each(function () {

            var
                testLink = '',
                thisUrl = '',
                matches = null;

            // exclude links that have the same hostname
            if (!newsd.ownHostRegExp.test(this.href)) {
                $(this).attr('data-external', true);
            }

            // convert facebook urls
            if (newsd.siteId === 'facebook') {

                testLink = decodeURIComponent(this.href);
                if(matches = newsd.lfbRegExp.exec(this.href)){
                    thisUrl = decodeURIComponent(matches[1]);
                }
                if (thisUrl !== '') {
                    $(this).attr('data-external', true);
                    $(this).attr('data-expanded-url', thisUrl);
                }
            }
        });

        // process external links
        $('a[data-external="true"]').each(function () {
            var urlHost = '';

            if ($(this).attr('data-is-news') !== 'true') {

                urlHost = newsd.getHost($(this));
                // check if link is in list of bad domains
                newsd.newsId = newsd.data[urlHost];

                // if link is in bad domain list, tag it
                if (typeof newsd.newsId !== 'undefined') {
                    $(this).attr('data-is-news', true);
                    $(this).attr('data-news-type', newsd.newsId.type);
                    $(this).attr('data-news-score', newsd.newsId.score);
                    $(this).attr('data-news-sentiment', newsd.newsId.sentiment);
                }
            }
        });
    },

    // Flag links
    flagPost: function ($badlinkWrapper) {

        'use strict';

        if (!$badlinkWrapper.hasClass('news-flag')) {

            switch (this.dataType) {
                case 'known':
                    $badlinkWrapper.before('<div class="known-news-alert-inline">' + this.warnMessage + '<br/>Reliability Score: ' + this.score +' <br/>Sentiment: '+ this.sentiment + ' </div>');
                    break;
                default:
                    $badlinkWrapper.before('<div class="news-alert-inline">' + this.warnMessage + '<br/>Reliability Score: ' + this.score +' <br/>Sentiment: '+ this.sentiment + ' </div>');
                    break;
            }

            /*
            if (this.dataType === 'caution') {
                $badlinkWrapper.before('<div class="news-alert-inline warning">' + this.warnMessage + '</div>');
            } else if (this.datatype === 'known') {
                $badlinkWrapper.before('<div class="known-news-alert-inline">' + this.warnMessage + '<br/>Reliability Score: <br/>Sentiment: </div>');
            } else {
                $badlinkWrapper.before('<div class="news-alert-inline">' + this.warnMessage + '<br/>Reliability Score: <br/>Sentiment: </div>');
            } 
            */

            $badlinkWrapper.addClass('news-flag');
        }
    },

    // Set alert on posts
    setAlertOnPosts: function () {

        'use strict';

        newsd.targetLinks();

        $('a[data-is-news="true"]').each(function () {
            newsd.dataType = $(this).attr('data-news-type');
            newsd.score = $(this).attr('data-news-score');
            newsd.sentiment = $(this).attr('data-news-sentiment');


            newsd.warningMsg();

            newsd.debug('Current warning link: ', this);
            newsd.debug('newsd.dataType: ', newsd.dataType);

            switch (newsd.siteId) {
            case 'facebook':
                if ($(this).parents('._1dwg').length >= 0) {
                    newsd.flagPost($(this).closest('.mtm'));
                }
                if ($(this).parents('.UFICommentContent').length >= 0) {
                    newsd.flagPost($(this).closest('.UFICommentBody'));
                }
                break;
            /* case 'twitter':
                if ($(this).parents('.tweet').length >= 0) {
                    newsd.flagPost($(this).closest('.js-tweet-text-container'));
                }
                break; */
            case 'badlink':
            case 'none':
                break;
            default:
                break;
            }
        });

        this.firstLoad = false;
    },

    // Main run this after a mutation
    observerCallback: function(){

      'use strict';

      newsd.debug('observerCallback');
      newsd.observerRoot.mutationSummary("disconnect");
      newsd.observerExec();
    },

    //Scan for posts, turn on the observer, and scan again for more changes
    observerExec: function(){

      'use strict';

      newsd.debug('observerExec');
      this.setAlertOnPosts();
      window.setTimeout(this.observe,500);
      window.setTimeout(this.setAlertOnPosts,1000);
    },

    
    // Turn on the mutation observer
    observe: function(){

      'use strict';

      newsd.debug('observe',newsd.observerCallback,newsd.observerFilter, newsd.observerRoot);
      newsd.observerRoot.mutationSummary("connect", newsd.observerCallback, newsd.observerFilter);
    },

    // Main execution script
    execute: function () {

        'use strict';

        if (this.firstLoad === true) {
            this.identifySite();

            if (this.siteId === 'badlink') {
                //this.flagSite();
            }

            this.firstLoad = false;
        }

        switch (this.siteId) {
        case 'facebook':
            this.observerRoot = $("body");
            this.observerFilter = [{ element:"div" }];
            break;
        /* case 'twitter':
            this.observerRoot = $("div#page-container");
            this.observerFilter = [{ element:"div" }];
            break; 
        */
        case 'badSite':
            break;
        case 'none':
        default:
            this.observerRoot = $("body");
            this.observerFilter = [{ element:"div" }];
            break;
        }

        this.observerExec();

    }
};

// Grab data from background and execute extension
if(window === window.top || url2Domain(window.location.hostname) == 'twitter.com'){
  var newsd = new NewsDetector();

// Grab data from background and execute extension
  chrome.runtime.sendMessage(null, {'operation': 'passData'}, null, function (state) {

    'use strict';

    newsd.data = state.sites;
    newsd.shorts = state.shorteners;

    // Data loaded, start execution.
    $(document).ready(function () {

      newsd.expandLinks = newsd.asynch.bind(null, newsd.getLinks, newsd.processLinks);
      newsd.execute();
    });
  });
}

// Listen for messages but only in the top frame
if (window.top === window) {
    chrome.runtime.onMessage.addListener(function (message) {

        'use strict';

        switch (message.operation) {
        /* case 'flagSite':
            newsd.dataType = message.type;
            newsd.flagSite();
            break; */
        case 'toggleFlag':
            if (newsd.flagState === 1) {
                newsd.hideFlag();
            } else if (newsd.flagState === -1) {
                newsd.showFlag();
            }
            break;
        }
    });
}

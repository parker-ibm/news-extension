// code comes from https://www.npmjs.com/package/article-parser


const {
    extract 
  } = require('article-parser');
   
  let url = 'https://www.foxnews.com/science/unfinished-city-future-arizona-desert';
   
  extract(url).then((article) => {
    console.log(article);
  }).catch((err) => {
    console.log(err);
  });
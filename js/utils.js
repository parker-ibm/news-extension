//  Utility functions needed by the front and backends of the extension

function url2Domain(url){

  'use strict';

  if(url){
    url = url.toString().replace(/^(?:https?|ftp)\:\/\//i, '');
    url = url.toString().replace(/^www\./i, '');
    url = url.toString().replace(/\/.*/, '');
    return url;
  }
}

var siteSearch;
var siteJSON;
var searchBox = document.getElementById('site-search');
var queryLabel = document.getElementById('query-label');

$.getJSON('/energize-andover-blog/index.json',jsonCallback);

searchBox.onchange = submitSearch;

function jsonCallback(data) {
	var idx = lunr(function () {
		this.field('content')
		this.field('title')
		this.field('description')
		this.ref('basename')

		data.forEach(function (doc) {
			this.add(doc)
		}, this)
	});

	siteJSON = data;
	siteSearch = function(query) {
		var search_result = idx.search(query);
		var getRef = function(obj){ return obj.ref; };
		return search_result.map(getRef);
	}
};


function submitSearch(){
	query = searchBox.value;
	if (query=='') {
		setAllDisplay('block');
		queryLabel.style.display = 'none'
	}
	else {
		setAllDisplay('none');
		displayPosts(siteSearch(query));
		queryLabel.style.display = 'block'
		queryLabel.innerHTML = 'Posts containing "' + query + '":';
	}
}

document.onkeydown=function(e){
    if(e.keyCode=='13'){
        submitSearch();
    }
}

function displayPosts(names) {
	for (var i=0; i<names.length; ++i)
		document.getElementById(names[i]).style.display = 'block';
}


function setAllDisplay(arg) {
	var posts = document.getElementById('post-list').children;
	for (var i=0; i<posts.length; ++i) {
		posts[i].style.display = arg;
	}
}

function hidePosts(names) {
	for (var i=0; i<names.length; ++i) {
		document.getElementById(names[i]).style.display = 'none'
	}
}

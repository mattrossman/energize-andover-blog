var siteSearch;

$.getJSON('/energize-andover-blog/index.json',jsonCallback);


function jsonCallback(data) {
	var idx = lunr(function () {
		this.field('content')
		this.field('title')
		this.ref('basename')

		data.forEach(function (doc) {
			this.add(doc)
		}, this)
	});
	
	siteSearch = function(query) {
		var search_result = idx.search(query);
		var getRef = function(obj){ return obj.ref; };
		console.log(search_result.map(getRef))
	}
};


function submitSearch(){
	query = document.getElementById('site-search').value;
	siteSearch(query);
}

document.onkeydown=function(e){
    if(e.keyCode=='13'){
        submitSearch();
    }
}

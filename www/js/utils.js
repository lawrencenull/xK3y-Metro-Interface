//Global variables needed
var firstLoad=true;
var colors = ['blue','red','green','mango','pink','brown','lime','teal','purple','magenta'];
var dropDownFlag, animCounter, data, saveData, xK3yIP, resizeTimer;
var listsMade=false;
var wallMade=false;
var foldersMade=false;
var t=true;
//All the pages with linked functions
var pages = {
	'coverwall-page' 			: function(){makeCoverWallPage()},
	'list-page' 				: function(args){makeListPage(args)},
	'folderstructure-page'		: function(args){makeFolderStructurePage(args)},
	'favorites-page' 			: function(args){makeFavoritesPage(args)},
	'favoritesmanagement-page'	: function(args){makeFavManagementPage(args)},
	'massAdding-page'			: function(){},
	'search-page' 				: function(){makeSearchPage()},
	'about-page' 				: function(){makeAboutPage()},
	'overlay' 					: function(args){makeOverlay(args)},
	'details-page' 				: function(args){prepDetails(args)},
	'main-screen'				: function(){},
	'config-page'				: function(){Translate.load(Translate.makeList)},
	'recentadd-page'			: function(){Recent.makePage()}
};
//Default settings
var defaultSettings = {
	'accent' : 'blue',
	'metro' : true,
	'language' : 'English',
	'slideChance' : 80
}

$(window).resize(function() { 
    clearTimeout(resizeTimer); 
    resizeTimer = setTimeout(fixTextInput, 100); 
});

$(document).ready(function() {
	Pages.allPages = pages;
	getData();
	/*if (document.documentElement.clientWidth>480) {
		viewport = document.querySelector("meta[name=viewport]"); 
		viewport.setAttribute('content', '');
	}

	if (document.documentElement.clientWidth==480) {
		viewport = $('meta[name=viewport]');
		viewport.attr('content', 'width = 320');
	}*/
});

$(window).hashchange(function() {
	getCurrentPage()
});

function getCurrentPage() {
	var hash = window.location.hash;
	showPage(hash);
}

function showPage(page) {
	//console.log('Hash change handled');
	//Always stop tile animation on page change
	Tile.stop();
	var allPages = Pages.allPages;
	var args;
	if (!page) {
		page='main-screen';
	}
	//Parse arguments
	if (page.indexOf('?')!=-1) {
		args=page.split('?',2);
		page=args[0];
	}
	//If hash is an overlay, go back
	if (page=='overlay') {
		history.back();
	}
	//Do we have a "#" in the page string? cut it off
	if (page.indexOf('#')==0) {
		page = page.slice(1,page.length);
	}
	//No "%"? Escape the page string to make sure we get it right
	if (page.indexOf('%')==-1) {
		page=escape(page);
	}
	//Hide all pages
	//for (var i in allPages) {
		//if ($(document.getElementById(i)).hasClass('active')) {
			//$(document.getElementById(i)).removeClass('active');
			$('.page.active').removeClass('active');
		//}
	//}
	//Show requested page
	$(document.getElementById(page)).addClass('active');
	
	if (!$.isFunction(allPages[page])) {
		//PANIC
		//A non-registered page has been requested
		//This function handles hashchanges
		//So it will loop until we get a safe page
		history.back();
		//Prevent calling page related functions
		return;
	}
	
	//Call function related to page
	allPages[page](args);

	//Trigger tile animation for the page, function determines if there will be animation
	Tile.init(page);
	return;
}

function search(input) {
	if (input.length==0) {
		document.getElementById('searchResults').innerHTML="";
		return;
	}
	else {
		var l = data.ISOlist.length;
		var allGames = data.ISOlist;
		var pattern=new RegExp(input,"i");
		var results=[];
		for (var i=0; i<l; i++) {
			//RegExp the input and push results to array
			if (pattern.test(allGames[i].name)) {
				results.push(allGames[i]);
			}
		}
		var l = results.length;
		var HTML='';
		var name, id, cover;
		//Loop through the results and make the HTML
		for (var i=0; i<l; i++) {
			name=results[i].name;
			id=results[i].id;
			cover='covers/'+id+'.jpg';
			//debug cover
			//cover = 'img/test.jpg';
			HTML+='<a href="#details-page?'+id+'&'+escape(name)+'"><div class="list-item" id="'+id+'"><div class="list-item-icon accent" style="background-image:url(\''+cover+'\'); background-size: 72px;"></div><span class="list-item-text">'+name+'</span></div></a>';
		}
		document.getElementById('searchResults').innerHTML=HTML;
	}
}

function openLetterOverlay() {
	var letters = ["a","b","c","d","e","f","g","h","i","j","k","l","m","n","o","p","q","r","s","t","u","v","w","x","y","z","#"];
	var avail = [];
	$('div[id^="list-divider-"]').each(function() {
		avail.push(this.id.slice(13,14));
	});
	avail.toString();
	var HTML='';
	//var cur=0;
	for (var i=0;i<letters.length;i++) {
		if (avail.indexOf(letters[i])==-1) {
			HTML+='<div class="overlay-item overlay-grey">'+letters[i]+'</div>'
		}
		else {
			HTML+='<a href="javascript:location.replace(\'#list-page?'+letters[i]+'\');"><div class="overlay-item '+saveData.Settings.accent+'">'+letters[i]+'</div></a>'
		}
		//cur++;
		/*if(cur == 4) {
			HTML+='<br/>';
			cur=0;
		}*/
	}
	document.getElementById('overlay').innerHTML=HTML;
	document.getElementById('overlay').style.height="100%";
	firstLoad=false;
}

function accentPopup() {
	var HTML='<div class="accent-item"><br/><span class="title">ACCENTS</span></div>';
	var current=saveData['Settings'].accent;
	for (var i=0; i<colors.length; i++) {
		if (colors[i]==current) {
			HTML+='<a href="javascript:history.back()" onclick="accentChange(\''+colors[i]+'\', true)"><div class="accent-item"><div class="accent-item-icon '+colors[i]+'"></div><span class="accent-item-text '+colors[i]+'-text">'+colors[i]+'</span></div></a>';
		}
		else {
			HTML+='<a href="javascript:history.back()" onclick="accentChange(\''+colors[i]+'\', true)"><div class="accent-item"><div class="accent-item-icon '+colors[i]+'"></div><span class="accent-item-text">'+colors[i]+'</span></div></a>';
		}
	}
	document.getElementById('overlay').innerHTML=HTML;
	document.getElementById('overlay').style.height="";
	firstLoad=false;
}

function accentChange(color, save) {
	var cur=saveData['Settings'].accent;
	//Tiles & other solid stuff
	$('.accent').removeClass(cur).addClass(color);
	//Highlights
	$('.accent-text').removeClass(cur+'-text').addClass(color+'-text');
	//List dividers have a border
	$('.accent-border').removeClass(cur+'-border').addClass(color+'-border');
	//Config button show correct color name
	$('#accentSelect span').html(color);
	saveData['Settings'].accent=color;
	if (save) {
		Settings.save();
	}
}

var Dropdown = {
	'open': function (element) {
		if (!dropDownFlag) {
			var dropDown = $(element);
			var current = dropDown.children('.dropdown-active');
			dropDown.find('span').attr('onclick', 'Dropdown.select(this.parentNode.parentNode, this.parentNode)');
			dropDown.attr('onclick','');
			current.removeClass('dropdown-active');
			dropDown.children('.dropdown-item').slideDown();
			dropDownFlag=true;
		}
	},
	'select': function (element, item) {
		if (dropDownFlag) {
			var item = $(item);
			var dropDown = $(element);
			if (dropDown.attr('onselect')) {
				var func = dropDown.attr('onselect').split(".");
				window[func[0]][func[1]](item.children('span').html());
			}
			item.addClass('dropdown-active').attr('onclick','');
			dropDown.children('.dropdown-item:not(".dropdown-active")').slideUp();
			dropDown.attr('onclick','Dropdown.open(this)');
			//FF bug, delay being able to open the dropdown by 1 millisecond
			setTimeout('dropDownFlag=false',1);
		}
	}
}

var CheckBox = {
	'notify': function (elem) {
		var checked = elem.checked;
		var name = elem.attributes.name.value;
		var customBox = document.getElementsByName(name).item(0);
		if (checked) {
			CheckBox.checkCustom(customBox);
		}
		else {
			CheckBox.uncheckCustom(customBox);
		}
	},
	'onclick': function (elem) {
		var checked = $(elem).hasClass('checkboxChecked');
		var name = elem.attributes.name.value;
		var nativeBox = document.getElementsByName(name).item(1);
		if (!checked) {
			CheckBox.checkCustom(elem);
			CheckBox.checkNative(nativeBox);
		}
		else {
			CheckBox.uncheckCustom(elem);
			CheckBox.uncheckNative(nativeBox);
		}
	},
	'check': function (elem) {
		var name = elem.attributes.name.value;
		var customBox = document.getElementsByName(name).item(0);
		CheckBox.checkNative(elem);
		CheckBox.checkCustom(customBox);
	},
	'uncheck': function (elem) {
		var name = elem.attributes.name.value;
		var customBox = document.getElementsByName(name).item(0);
		CheckBox.uncheckNative(elem);
		CheckBox.uncheckCustom(customBox);
	},
	'checkNative': function (elem) {
		elem.checked = true;
	},
	'uncheckNative': function (elem) {
		elem.checked = false;
	},
	'checkCustom': function (elem) {
		$(elem).addClass('checkboxChecked');
	},
	'uncheckCustom': function (elem) {
		$(elem).removeClass('checkboxChecked');
	}
}

var MessageBox = {
	'Show': function (title, text, buttonHTML) {
		//WP7 already has the smexy alert box, use native
		if (navigator.userAgent.search('Windows Phone') != -1) {
			alert(text);
		}
		else {
			var HTML = '<span class="messagebox-title">'+title+'</span>';
			HTML +=	'<span class="messagebox-text">'+text+'</span>';
			if (buttonHTML==null) {
				HTML += '<a class="button" href="javascript:MessageBox.Close();" style="float:left">ok</a>';
			}
			else {
				HTML += buttonHTML+'<a class="button" href="javascript:MessageBox.Close();" style="float:right">Cancel</a>';
			}
			$('#MessageBox').html(HTML);
			$('#MessageBox').addClass('active');
			scrollUp();
		}
	}, 
	'Close': function () {
		$('#MessageBox').removeClass('active');
	}
}

var Pin = {
	'toMain': function (id, name) {
		var HTML='';
		var cover='covers/'+id+'.jpg';
		//debug cover
		//cover = 'img/test.jpg';
		var color=saveData.Settings.accent;
		//Build the tile
		HTML+='<a href="#details-page?'+id+'&'+escape(name)+'">';
		HTML+='<div class="tile accent animate '+color+'" style="background-image:url(\''+cover+'\'); background-size: 173px;">';
		HTML+='<span class="tile-title">'+name+'</span>';
		HTML+='</div></a>';
		//Append to main menu
		document.getElementById('main-screen').innerHTML+=HTML;
	},
	'load': function () {
		var favLists = Fav.lists();
		if ($.isEmptyObject(favLists)) {
			return;
		}
		var pinList = favLists.Pinned;
		if ($.isEmptyObject(pinList)) {
			return;
		}
		var l = pinList.length;
		var id, name;
		for (var i=0; i<l; i++) {
			id = pinList[i].id;
			name = pinList[i].name;
			Pin.toMain(id, name);
		}
	},
	'add': function (id, name) {
		var listName = 'Pinned';
		var favLists = Fav.lists();
		var result;
		if ($.isEmptyObject(favLists)) {
			favLists={};
		}
		if (!(listName in favLists)) {
			Fav.createList(id, name, listName);
			result = true;
		}
		else {
			result = Fav.addToList(id, name, listName);
		}
		if (result) {
			Pin.toMain(id, name);
		}
		prepDetails(id, name);
	},
	'remove': function (id, name) {
		var listName = 'Pinned';
		Fav.removeFromList(id, false, listName);
		$('#main-screen').find('a[href^="#details-page?'+id+'"]').remove();
		prepDetails(id, name);
	}
}

var Fav = {
	'createList': function (id, name, listName) {
		if (!listName) {
			listName = document.getElementById('favCreateInput').value;
		}
		var favLists = Fav.lists();
		if ($.isEmptyObject(favLists)) {
			favLists={};
		}
		else if (listName in favLists) {
			var string = Translate.strings["string-listexists"];
			var title = Translate.strings["string-error"];
			var message = string.replace("%s", unescape(listName));
			MessageBox.Show(title, message);
			return;
		}
		favLists[listName]=[];
		Fav.save(favLists, false);
		Fav.addToList(id, name, listName);
		makeFavManagementPage(['page', id+'&'+name]);
	},
	'createEmptyList': function (listName) {
		if (!listName) {
			listName = document.getElementById('favCreateInput').value;
		}
		var favLists = Fav.lists();
		if ($.isEmptyObject(favLists)) {
			favLists={};
		}
		else if (listName in favLists) {
			var string = Translate.strings["string-listexists"];
			var title = Translate.strings["string-error"];
			var message = string.replace("%s", unescape(listName));
			MessageBox.Show(title, message);
			return;
		}
		favLists[listName]=[];
		Fav.save(favLists, true);
		makeFavManagementPage(['page', 'main']);
	},
	'removeList': function (listName, management) {
		var favLists = Fav.lists();
		if (!listName) {
			listName = unescape($('#listRemoveDropdown').children('.dropdown-active').attr('id'));
		}
		delete favLists[listName];
		Pages.removePage(listName+'-list');
		Fav.save(favLists, true);
		if (management) {
			makeFavManagementPage(['page', 'main']);
		}
	},
	'addToList': function (id, name, listName, mass) {
		var flag=false;
		if (!listName) {
			listName = unescape($('#favAddDropdown').children('.dropdown-active').attr('id'));
			flag=true;
		}
		var favLists = Fav.lists();
		var gameList = favLists[listName];
		var inList = Fav.findList(id);
		var index = Fav.findIndex(inList, listName);
		if (index == -1) {
			gameList.push({
				"id" : id,
				"name" : name });
		}
		else {
			return false;
		}
		if (mass) {
			//Save to local object
			Fav.save(favLists, false);
			return;
		}
		//Save to server
		Fav.save(favLists, true);
		if (flag) {
			makeFavManagementPage(['page', id+'&'+name]);
			return;
		}
		return true;
	},
	'removeFromList': function (id, name, listName, mass) {
		var flag=false;
		if (!listName) {
			listName = unescape($('#favRemoveDropdown').children('.dropdown-active').attr('id'));
			flag=true;
		}
		var favLists = Fav.lists();
		var gameList = favLists[listName];
		var index = Fav.findIndex(gameList, id, true);
		if (index == -1 ) {
			return;
		}
		gameList.splice(index,1);
		if (gameList.length==0) {
			//Fav.removeList(listName);
		}
		if (mass) {
			//Save to local object
			Fav.save(favLists, false);
			return;
		}
		//Save to server
		Fav.save(favLists, true);
		if (flag) {
			makeFavManagementPage(['page', id+'&'+name]);
		}
	},
	'Mass': {
		'new': function (listName) {
			if (!listName) {
				listName = unescape($('#massAddDropdown').children('.dropdown-active').attr('id'));
			}
			if (!Fav.Mass.ISO.isBuild) {
				Fav.Mass.ISO.build(listName);
			}
			else {
				Fav.Mass.init(listName);
			}
			showPage('massAdding-page');
		},
		'init': function (listName) {
			var favLists = Fav.lists();
			var gameList = favLists[listName];
			var checkBoxes = $('#massaddingcontainer').find('input[type="checkbox"]');
			var l = checkBoxes.length;
			for (var i = 0; i<l; i++) {
				var cur = checkBoxes[i];
				var id = cur.id;
				var index = Fav.findIndex(gameList, id, true);
				if (index != -1) {
					CheckBox.check(cur);
				}
			}
			$('#massSaveButton')[0].name = escape(listName);
		},
		'save': function () {
			var listName = unescape($('#massSaveButton')[0].name);
			var checkBoxes = $('#massaddingcontainer').find('input[type="checkbox"]');
			var toSave = checkBoxes.filter(':checked');
			var toRemove = checkBoxes.not(':checked');
			var l = toSave.length;
			var k = toRemove.length;
			for (var i=0; i<l; i++) {
				var id = toSave[i].id;
				var name = unescape(toSave[i].name);
				Fav.addToList(id, name, listName, true);
			}
			for (var i=0; i<k; i++) {
				var id = toRemove[i].id;
				var name = unescape(toRemove[i].name);
				Fav.removeFromList(id, name, listName, true);
			}
			var favLists = Fav.lists();
			Fav.save(favLists, true);
			showPage('favoritesmanagement-page?main');
		},
		'ISO': {
			'build': function (listName) {
				//Copy the ISOList! We don't want to mess up the other menus
				var ISOlist = data.ISOlist.slice();
				//Make it alpabetically listed
				ISOlist.sort(function(x,y) { 
					var a = String(x.name).toUpperCase(); 
					var b = String(y.name).toUpperCase(); 
					if (a > b) 
						return 1 
					if (a < b) 
						return -1 
					return 0; 
				});
				var iso, id, index;
				var l = ISOlist.length;
				var HTML = '';
				for (var i=0;i<l;i++) {
					iso = ISOlist[i].name;
					id = ISOlist[i].id;
					if (index != -1) {
						check='checked="checked"';
					}
					HTML+='<div class="checkbox" name="'+escape(iso)+'" onclick="CheckBox.onclick(this)"></div>';
					HTML+='<input type="checkbox" name="'+escape(iso)+'" id="'+id+'" onchange="CheckBox.notify(this)" class="invis"/><label for="'+id+'">'+iso+'</label><br/>';
				}
				HTML+='<br/><div class="details-button-pane"><a id="massSaveButton" href="javascript:Fav.Mass.save()" name="'+escape(listName)+'" class="button widebutton">'+Translate.strings["string-done"]+'</a><br/><br/></div>';
				document.getElementById('massaddingcontainer').innerHTML += HTML;
				Fav.Mass.ISO.isBuild = true;
				Fav.Mass.init(listName);
			},
			'isBuild': false
		}
	},
	'rename': function (oldName, newName) {
		if (!oldName) {
			oldName = unescape($('#listRename').children('.dropdown-active').attr('id'));
			newName = document.getElementById('favRenameInput').value;
		}
		var favLists = Fav.lists();
		favLists[newName] = favLists[oldName];
		delete favLists[oldName];
		Fav.save(favLists, true);
		showPage('favoritesmanagement-page?main');
	},
	'findList': function (id) {
		var savedFavLists = Fav.lists();
		var foundLists = [];
		for (var i in savedFavLists) {
			if (JSON.stringify(savedFavLists[i]).indexOf(id)!=-1) foundLists.push(i);
		}
		return foundLists;
	},
	'findIndex': function (array, id, game) {
		if (game) {
			for (var i=0; i<array.length; i++) {
				if (array[i].id==id) return i;
			}
			return -1;
		}
		for (var i=0; i<array.length; i++) {
			if (array[i]==id) return i;
		}
		return -1;
	},
	'lists': function () {
		return saveData.FavLists;
	},
	'save': function (favLists, toServer) {
		saveData.FavLists = favLists;
		if (toServer) {
			Settings.save();
		}
	}
}

var Pages = {
	'newPage': function (id, name, func) {
		if (id.indexOf('%')==-1) {
			id=escape(id);
		}
		var page = '<div id="'+id+'" class="page"><div class="spacer"></div><div class="spacer"></div><span class="page-title">'+unescape(name)+'</span><br/><br/></div>';
		//#main is the main container, append page to there
		document.getElementById('main').innerHTML+=page;
		if (!func) {
			func = function(){};
		}
		//Register page
		Pages.allPages[id]=func;
	},
	'removePage': function (id) {
		if (id.indexOf('%')==-1) {
			id=escape(id);
		}
		var selector = document.getElementById(id);
		var page = $(selector);
		//Clean up HTML
		page.remove();
		//Unregister page
		delete Pages.allPages[id];
	},
	'allPages': {}
}

var Tile = {
	'animateHalf': function (tile) {
		$(tile).animate({'background-position': '0 86px'});
		$(tile).children('span').animate({'bottom': '92px'});
		//setTimeout(Tile.animateDown, 2500);
	},
	'animateDown': function (tile) {
		$(tile).animate({'background-position': '0 173px'});
		$(tile).children('span').animate({'bottom': '6px'});
		//setTimeout(Tile.animateUp, 2500);
	},
	'animateUp': function (tile) {
		$(tile).animate({'background-position': '0 0'});
		$(tile).children('span').animate({'bottom': '179px'});
		//setTimeout(Tile.animateHalf, 2500);
	},
	'animateNext': function(tile,index) {
		var doAnim;
		//Saved probability
		var prob = saveData.Settings.slideChance;
		if (prob == 0) {
			Tile.stop();
			return;
		}
		//Random 0-100
		var random=Math.floor(Math.random()*101);
		if (random<=prob) {
			doAnim=true;
		}
		else {
			doAnim=false;
		}
		if (doAnim) {
			//var bgY = $.curCSS(tile,'background-position-y');
			var bgY = $(tile).css('backgroundPosition');
			if (bgY=="" || !bgY) {
				bgY = '0px 0px';
			}
			var pos=toArray(bgY);
			var nextState;
			switch (pos[2]) {
				case 0:
					nextState='animateHalf';
					break;
				case 86:
					nextState='animateDown';
					break;
				case 173:
					nextState='animateUp';
					break;
				default:
					//Previous anim didn't finish, reset
					nextState='animateUp';
					break;
			};
			Tile[nextState](tile);
			var dbgText='bgPosY: '+pos[2]+'<br/>nextState: '+nextState+'<br/>curTile:'+index;
			//Tile.log(dbgText);
			return;
		}
		else {
			return;
		}
		//Tile.log('random int lower than 20, delaying animation... ('+random+')');
	},
	'animateLoop': function (tiles) {
		var l = tiles.length;
		var random=Math.floor(Math.random()*l);
		var cur=tiles[random];
		Tile.animateNext(cur,random);
		var delay=function(){Tile.animateLoop(tiles)};
		animCounter=setTimeout(delay, 2500);
	},
	'init': function (page) {
		//Tile.log('Animation initiated!');
		var tiles=$(document.getElementById(page)).find('.animate');
		var l=tiles.length;
		if (l==0) {
			return;
		}
		var delay=function(){Tile.animateLoop(tiles)};
		animCounter=setTimeout(delay, 2500);
		//$('a[onclick^="Tile"]').find('span').html('click to stop tile animation');
		//$('a[onclick^="Tile"]').attr('onclick','Tile.stop()');
	},
	'saveProbability' : function(string) {
		var prob = string.split("/")[0];
		saveData.Settings.slideChance = prob;
		Settings.save();
	},
	'loadProbability' : function() {
		var prob = saveData.Settings.slideChance;
		$('#slideProbablity').find('.dropdown-active').removeClass('dropdown-active');
		$('#slideProbablity').find('div:contains("'+prob+'/100")').addClass('dropdown-active');
	},
	'stop': function () {
		clearTimeout(animCounter);
		//$('a[onclick^="Tile"]').find('span').html('click to start tile animation');
		//$('a[onclick^="Tile"]').attr('onclick',"Tile.init('main-screen')");
		//Tile.log('Animation counter cleared!');
	},
	'log': function (msg) {
		document.getElementById('tileDebug').innerHTML='Debug:<br/>'+msg;
	}
}

var Translate = {
	'load' : function (callback) {
		if ($.browser.msie) {
			var xdr = new XDomainRequest();
			xdr.onload = function() {
				var reply = xdr.responseText;
				var langs = reply.split(', ').slice(0,-1);
				callback(langs);
			}
			var anticache = Math.floor(Math.random()*10000001);
			xdr.open("get", 'http://bwerkt.nl/xkey/translate/list.php?_='+anticache);
			xdr.send();
		}
		else {
			$.ajax({
				type: "GET",
				url: "http://bwerkt.nl/xkey/translate/list.php",
				cache: false,
				success: function(reply) {
					var langs = reply.split(', ').slice(0,-1);
					callback(langs);
				}
			});
		}
	},
	'select' : function (lang) {
		if ($.browser.msie) {
			var xdr = new XDomainRequest();
			xdr.onload = function() {
				var reply = JSON.parse(xdr.responseText);
				Translate.translate(reply);
			}
			var anticache = Math.floor(Math.random()*10000001);
			xdr.open("get", 'http://bwerkt.nl/xkey/translate/load.php?lang='+lang+'&_='+anticache);
			xdr.send();
		}
		else {
			$.ajax({
				type: "GET",
				dataType: 'json',
				url: "http://bwerkt.nl/xkey/translate/load.php?lang="+lang,
				cache: false,
				success: function(reply) {
					Translate.translate(reply);
				}
			});
		}
		saveData.Settings.language = lang;
		Settings.save();
	},
	'translate' : function (translation) {
		Translate.strings = translation;
		for (var i in translation) {
			$('.'+i).html(translation[i]);
		}
	},
	'makeList' : function (langs) {
		var cur=saveData['Settings'].language;
		var index = Fav.findIndex(langs, cur, false);
		var HTML = '';
		/*HTML+='<div id="'+cur+'" class="dropdown-item dropdown-active">';
		HTML+='<span class="dropdownText">'+cur+'</span>';
		HTML+='</div>';*/
		//langs.splice(index, 1);
		var l = langs.length;
		for (var i=0;i<l;i++) {
			HTML+='<div id="'+langs[i]+'" class="dropdown-item '+(langs[i]==cur ? "dropdown-active" : "")+'">';
			HTML+='<span class="dropdownText">'+langs[i]+'</span>';
			HTML+='</div>';
		}
		document.getElementById('languageSelect').innerHTML = HTML;
	},
	'strings' : {
		"title" : "XK3Y WEB INTERFACE",
		"title-main" : "main",
		"title-coverwall" : "coverwall",
		"title-lists" : "lists",
		"title-folderstructure" : "folder structure",
		"title-favorites" : "favorites",
		"title-favmanagement" : "fav management",
		"title-massadding" : "Mass adding",
		"title-search" : "search",
		"title-config" : "config",
		"title-about" : "about",
		"xkeyinfo" : "xk3y information",
		"otherinfo" : "other information",
		"accent-title" : "Accent color",
		"language-title" : "Interface Language",
		"slideprob-title" : "Slide probability",
		"string-slideprob" : "Choose the probability of which tiles will slide.",
		"string-accent" : "Change the accent color to match your mood.",
		"string-language" : "Select your preferred language.",
		"string-delete" : "Delete all saved data",
		"string-nolists" : "No lists",
		"string-managefav" : "Manage favorites",
		"string-createlist" : "Create a new list:",
		"string-listexists" : "List %s already exists!",
		"string-removelist" : "Select a list to remove:",
		"string-addtolist" : "Select a list to add this game to:",
		"string-removefromlist" : "Select a list to remove this game from:",
		"string-removelist" : "Select a list to remove:",
		"string-massadd" : "Select a list to mass add to:",
		"string-rename" : "Select a list to rename:",
		"string-pinmain" : "Pin to main",
		"string-removepin" : "Remove from main",
		"string-notitle" : "No Title",
		"string-done" : "done",
		"string-close" : "close",
		"string-play" : "play",
		"string-done-close" : "When you're done, you can go back by clicking 'close'",
		"string-loadingtitle" : "Loading Notification",
		"string-opentray" : "Please open your DVD tray",
		"string-alreadyloaded" : "A game appears to be already loaded, please open your DVD tray and click 'Reload'",
		"string-reload" : "Reload",
		"string-scrollup" : "Scroll up",
		"string-error" : "Error"
	}
}

var Settings = {
	'init': function () {
		var settings = saveData['Settings'];
		var accent, language;
		if ($.isEmptyObject(settings)) {
			Settings.firstRun();
			return;
		}
		else if (!settings.metro || !settings.language || !settings.slideChance) {
			Settings.firstMetroRun();
			return;
		}
		else {
			//All future settings should be loaded here
			accent=settings.accent;
			language=settings.language;
		}
		//All required functions called with settings
		accentChange(accent);
		Translate.select(language);
		Tile.loadProbability()
		Pin.load();
	},
	'save': function () {
		$.post('store.sh', JSON.stringify(saveData));
	},
	'firstRun': function () {
		//First run settings
		var settings = defaultSettings;
		saveData['Settings']=settings;
		Settings.save();
		Settings.init();
	},
	'firstMetroRun': function () {
		//First Metro run, preserve already saved settings
		saveData['Settings'] = $.extend(saveData['Settings'],defaultSettings);
		Settings.save();
		Settings.init();
	},
	'reset': function () {
		saveData="";
		Settings.save();
	}
}

function updateActive(id) {
	var color=saveData['Settings'].accent;
	$('span.accent-text').removeClass(color+'-text accent-text');
	$('.'+id).children('span').addClass(color+'-text accent-text');
	data.active=id;
}

function scrollToLetter(letter) {
	window.scroll(0,$(document.getElementById('list-divider-'+letter)).offset().top);
}

function scrollUp() {
	window.scroll(0,0);
}

function toArray(strg){
    strg = strg.replace(/([0-9\.]+)(\s|\)|$)/g,"$1px$2");
    var res = strg.match(/(-?[0-9\.]+)(px|\%|em|pt)\s(-?[0-9\.]+)(px|\%|em|pt)/);
    return [parseFloat(res[1],10),res[2],parseFloat(res[3],10),res[4]];
}

function isNumber (o) { 
  return ! isNaN (o-0); 
}

function fixTextInput() {
	$('.searchinput').css('width', $(window).width()-50+'px');
}

function isHDD (dir) {
	return (data.drives.toString().indexOf(dir)!=-1);
}
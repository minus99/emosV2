
// shop admin

var table;

var Admin = {
    definitions:{
        mainTabs: null,
        currentID: null,
        tabsCookies: null
    },

    uty: {
        ajx: function (o, callback) {
            $.ajax({
                type: o['type'] || 'GET',
                dataType: o['dataType'] || 'html',
                url: o['uri'] || '',
                data: o['param'] || {},
                contentType: o['contentType'] || '',
                error: function (e) {
                    if (typeof callback !== 'undefined')
                        callback({ type: 'error' });
                },
                timeout: 30000,
                success: function (d) {
                    if (typeof callback !== 'undefined')
                        callback({ type: 'success', val: d });
                }
            });
        }
    },
    init: function(){
        var t = this,
            //currentID = null,
            tabsCookies = t.cookies.check("@alaashopcookies");
            
        //t.definitions.currentID = currentID;
        
        // check for tabs cookies to open them
        if (tabsCookies != null)
        {    
            var tabs = JSON.parse( tabsCookies );
            t.definitions.tabsCookies = tabs;
            
            t.activateCurrentTab();
            t.openOtherTabsFromCookies();
            
        }
        else
            t.activateCurrentTab();
        
        // activate the current page
        t.activate();
        console.log("▶ Admin Script is Ready");
        
        //setTimeout(function(){ console.clear(); console.log("▶ Admin Script is Ready"); }, 2000);
    },
    activateCurrentTab: function(){
        var t = this;
        // detect main tabs HTML and trigger.
        if( detectEl("#main-tabs ul li:eq(0) a") )
        {
            var a = $("#main-tabs ul li:eq(0) a");
                t.definitions.currentID = $("#main-tabs ul li:eq(0) a").attr("href").replace("#", "");
            this.tabs.registerTab({url: a.attr("data-url"), ID:t.definitions.currentID, title:a.attr("title")});
            
            var mainTabs = $( "#main-tabs" ).tabs({classes: {"ui-tabs-active": "active"},
                                                  activate: function(event, ui){
                                                
                                                    var url = $("#main-tabs ul li:eq("+ ui.newTab.index() +") a").attr("data-url"),
                                                        title = $("#main-tabs ul li:eq("+ ui.newTab.index() +") a").attr("title");
                                                        
                                                        console.log(url, title, ui.newTab.index());
                                                    
                                                    t.registerToHistory(title, url);
                                            }});
            
            mainTabs.find( ".ui-tabs-nav" ).sortable({
                axis: "x",
                stop: function() { mainTabs.tabs( "refresh" ); Admin.tabs.refreshOrder(); }
            });
            
            mainTabs.on( "click", "span.glyphicon-remove", function(){ t.tabs.close( this ); });
            
            t.definitions.mainTabs = mainTabs;
        }
    },
    openOtherTabsFromCookies: function(){
            var t = this;
            var tabs = this.definitions.tabsCookies;
            if (tabs[t.definitions.currentID] != null)
            var currentIndex = tabs[t.definitions.currentID].open;
            
            console.log("------", currentIndex, tabs);
            
            var sorted = makeArrayAndSortBy(tabs, "open");
            
            console.log(sorted);
            
            //console.log(tabs);
            //var sorted = Object.keys(tabs).sort(function(a,b){return tabs["open"]-tabs["open"]});
            //console.log(sorted);
            
            // open all tabs on cookie except the current page.
            for(var i in sorted)
            {
                console.log("|||||",sorted[i][0]);
               if (sorted[i][0] != t.definitions.currentID)
               {
                    //console.log(sorted[i][0]);
                    t.tabs.open({url:sorted[i][1].url, title:sorted[i][1].title, ID:sorted[i][0]}, false, sorted[i][1].open < currentIndex ? "before" : "after");
               }
            }
    },
    
    // main page tabs manager
    tabs:{
        open: function(obj, fixed, place){
            
            var _tbs = this,
                _place = place || null,
                tabs = Admin.definitions.mainTabs,
                tabTemplate = '<li id="tab-#{id}" role="presentation"><a data-url="#{url}" title="#{title}" href="#{id}">#{title}'+ (fixed ? '' : '<span class="glyphicon glyphicon-remove"></span>') + '</a></li>',
                ID = obj.ID;
            
            if (this.openTabs[ID] == null)
            {
                var li = $( tabTemplate.replace( /#\{id\}/g, "#"+ID).replace( /#\{title\}/g, obj.title ).replace( /#\{url\}/g, obj.url));
                $("#main-tabs > ul > li.active").removeClass("active");
                
                console.log("nananna", Admin.definitions.currentID );
                
                switch (_place) {
                    case "after":
                        tabs.find(">.ui-tabs-nav li[aria-controls="+Admin.definitions.currentID+"]").after( li );
                        break;
                    case "before":
                        tabs.find(">.ui-tabs-nav li[aria-controls="+Admin.definitions.currentID+"]").before( li );
                        break;
                    default:
                        tabs.find(">.ui-tabs-nav").append( li );
                }
                
                tabs.append('<div id="'+ID+'">Loading '+ ID +'</div>');
                tabs.tabs("refresh");
                
                if (_place == null ){
                    console.log("clicked"); $('a[href="#'+ID+'"]').click();
                }
                
                this.registerTab({url: obj.url, ID:ID, title:obj.title});
                
                if (_place == null) this.load(obj.url, ID, true); else this.load(obj.url, ID, false);
                
                this.refreshCookies();
            }
            else
            {
                $('a[href="#'+ID+'"]').click();
            }
        },
        registerTab: function(obj){
            
            console.log("registertab", obj.ID, this.index);
            
            var _this = this,
                _index = 0;
                
            if ( Admin.definitions.tabsCookies != null) {
                
                console.log("tab cookies is not null");
                
                _index = Admin.definitions.tabsCookies[obj.ID] != null ? Admin.definitions.tabsCookies[obj.ID].open : _this.index;
            }
            else
            {
                console.log("tab cookies is null");
                _index = this.index;
            }
            
            console.log("±±±±±", _index);
            
                _this.openTabs[obj.ID] = {open:_index, url: obj.url, ID:obj.ID, title:obj.title};
                _this.index++;
                
                
        },
        close: function(obj){
            var ID = $( obj ).closest( "li" ).remove().attr( "aria-controls" ), t = this;
            $( "#" + ID ).remove();
            
            delete this.openTabs[ID];
            
            // select another tab on close
            if( Object.keys(t.openTabs).length == 0 )
                this.open({url:"/tr/admin", title:"home", ID:"home"}, true);
            else
                for ( i in t.openTabs)
                    if( t.openTabs[i] != null ) {
                        $('a[href="#'+i+'"]').click();
                        Admin.registerToHistory(i, t.openTabs[i].url);
                        break;
                    }
            
            this.refreshCookies();
        },
        load: function( url, ID, register )
        {
            var t = this;
            
            $.ajax({
                type: 'GET',
                dataType: 'html',
                url: url,
                cache: false,
                error: function (xhr, ajaxOptions, thrownError) {
                    alert(xhr.responseText);
                    alert(thrownError);
                },
                xhr: function () {
                    var xhr = new window.XMLHttpRequest();
                    
                    //Download progress
                    xhr.addEventListener("progress", function (evt) {
                        if (evt.lengthComputable) {
                            var percentComplete = evt.loaded / evt.total;
                            
                            //progressElem.html(Math.round(percentComplete * 100) + "%");
                            
                            console.log(Math.round(percentComplete * 100));
                        }
                        else
                            console.log("bullshit");
                            
                    }, false);
                    
                    return xhr;
                },
                beforeSend: function () { $('.preloader').addClass("show"); },
                complete: function () {
                    $(".preloader").addClass("done");
                    setTimeout(function(){
                        $(".preloader").removeClass("show");
                        setTimeout(function(){
                            $(".preloader").removeClass("done");
                        }, 200);
                    }, 300);
                },
                success: function (data) {
                    
                    var html = $(data).find("div.page-content");
                    
                    $("#"+ID).html( html );
                    Admin.activate("#"+ID);
                    if( register ) Admin.registerToHistory(ID, url);
                }
            });
        },
        refreshCookies: function(){
            Admin.cookies.write("@alaashopcookies", JSON.stringify(this.openTabs));
        },
        refreshOrder: function(){
            var t = this;
            $("#main-tabs > ul > .ui-tabs-tab").each(function(index){
                var id = $("a", this).attr("href").replace("#", "");
                
                t.openTabs[id].open = index;
                t.refreshCookies();
                
                console.log(id, index);
                
            });
        },
        index: 0,
        openTabs: {}
    },
    activate: function( ID ){
        for ( i in this.actions)
            this.actions[i]( ID );
    },
    actions:{
        // make links with no target="blank" open in a tab rather than a new page
        links: function( ID ){
            var _ID = ID || "", t = Admin;
            
            $(_ID+" a").each(function(){
                if( $(this).attr("target") != "blank" && $(this).attr("href").indexOf("#") < 0 )
                    $(this).unbind("click").click(function( event ){
                        event.preventDefault();
                        t.tabs.open({url:$(this).attr("href"), title:$(this).attr("title"), ID:$(this).attr("data-id")});
                    });
            });
        },
        // activate tabs inside a page
        tabs: function( ID ){
            var _ID = ID || "";
            
            var gridtabs = $(_ID+" #tabs").tabs({classes: {"ui-tabs-active": "active"}});
        },
        // activate date-picker and date ranger picker
        datePicker: function( ID ){
            var _ID = ID || "";
            
            $(_ID+" .date-picker").each(function(){
                
                if ( $(this).attr("itemprop") == "single" ) {
                    $(this).dateRangePicker({
                        autoClose:true,
                        singleDate:true,
                        showShortcuts:false
                    });
                }
                else if ( $(this).attr("itemprop") == "range" ) {
                    $(this).dateRangePicker({
                        showShortcuts: true,
                        shortcuts :{'prev-days': [3,5,7],'prev': ['week','month','year'],'next-days':null,'next':null}
                    });
                }
            });
        },
        // activate drag and drop functionality
        dragAndDrop: function( ID ){    // drag and drop
            var _ID = ID || "";
            
            dragula([document.querySelector(_ID+" #left-defaults"), document.querySelector(_ID+" #right-defaults")], {
                moves: function(el, container, handle){ return handle.classList.contains('handle'); }
            });
        },
        // activate data table grid
        table: function( ID ){
            var _ID = ID || ""; console.log(_ID)
            $(_ID+" .data-table").each(function(){
                eval("var config = " + $('noscript', this).html());
                
                table = $('table', this).DataTable( config );
                
                if( $('noscript', this).attr("dir") != undefined)
                    eval($('noscript', this).attr("dir") + "()");
            });
        },
        // multiselect
        multiselect: function( ID ){
            var _ID = ID || "";
            $(_ID+" .multiselect").each(function(){
                $(this).Multiselect({}, function( data ){
                    searchPageControls(_ID, data);
                });
            });
        },
        //search page
        searchSubmitting: function( ID ){
            var _ID = ID || "";
            $(_ID+" .submitSearchForm").click(function( event ){
                
                event.preventDefault();
                
                var form = $(this).parents("form");
                var url = table.ajax.url();
                
                    url = url.indexOf("?") > 0 ? url.substr(0, url.indexOf("?")) : url;
                
                table.ajax.url( url +"?"+$(form).serialize() ).load(function() { Admin.actions.links(_ID); });
                
             });

        },
        // activate forms and detect input changes
        forms: function( ID ){
            var _ID = ID || "";
            $(_ID + " form").each(function(index){
                $(this).attr("id", _ID.substring(1)+"_frm"+index);
                $("input", this).change(function(){
                    $(this).parents("form").addClass("changed");
                    $(_ID + " form[data-toggle=main]").addClass("changed");
                });
            });
        },
        panel: function( ID ){
            var _ID = ID || "";
            
            $(_ID + " .panel-body").each(function(index){
                
                var n = "w"+index;
                $(this).attr("id", n);
                
                if ( $(this).hasClass("widget") ) {
                    $(this).load($(this).attr("data-source"), function(data){
                    
                        Admin.activate("#"+n);
                    
                    });
                }
                
            });
        }
    },
    
    // register clicked page to browser history
    registerToHistory: function(page, url) {
        if (history && history.pushState){
            var obj = {Page:page, Url:url};
            history.pushState(obj, obj.Page, obj.Url);
        }
    },
    
    // cookies manager
    cookies: {
        write: function(key, value, days){
            var _days = days || 7;
            var d = new Date();
                d.setTime(d.getTime() + (_days*24*60*60*1000));
            document.cookie = key + "=" + value + ";   expired=" + d.toGMTString();
        },
        check: function(key){
            var value = "; " + document.cookie,
                parts = value.split("; " + key + "=");
            return parts.length == 2 ? parts.pop().split(";").shift() : null;
        }
    },
    page:{
        save: function(obj, closeAfterSave){
            var p = this,
                page = $(obj).parents(".page-content");
                
            if ( p.submitting == false ) {
                
                p.submitting = true;
                
                p.forms = $("form.changed", page).length;
                
                if ( p.forms == 0) {
                    p.submitting = false;
                }
                
                p.success = 0;
                $("#error-desc").html("<b>Oops! some problem occured:<b><br>").addClass("hidden");
                
                $("form.changed", page).each(function(){
                    
                    $(this).parents(".panel").removeClass("panel-danger panel-success panel-info").addClass("panel-warning");
                    
                    var attributes = {};
                        $($(this)[0].attributes).each(function(){
                            attributes[this.nodeName] = this.nodeValue;
                        });
                        
                    $.ajax({
                        data: $(this).serialize(),
                        type: $(this).attr('method'),
                        url: $(this).attr('action'),
                        success: function(response) {

                            //console.log(JSON.parse(response));
                            p.response( response , attributes );
                            
                        }
                    });
                });
            }
        },
        response: function( response, attributes ){
            var p = this,
                _id = attributes.id;
                
            if (response.Success)
            {
                $("#"+_id).parents(".panel").removeClass("panel-warning").addClass("panel-success");
                $("#"+_id+" .has-error").removeClass("has-error");
                
                if ( attributes["data-toggle"] == "main") {
                    p.redirect = response.redirect;
                }
                
                p.success++;
            }
            else
            {
                $("#"+_id).parents(".panel").removeClass("panel-warning").addClass("panel-danger");
                $("#error-desc").append("<b>"+_id+"</b><br>").removeClass("hidden");
                
                for( item in response.data )
                {
                    $("#"+_id+" input[name="+item+"]").parent("div").addClass("has-error");
                    $("#error-desc").append( "- " + response.data[item] + "<br>" );
                }
                
                p.submitting = false;
            }
            
            if ( p.success == p.forms ) p.refresh( p.redirect );
            
        },
        refresh: function( url ){
            var p = this;
                p.submitting = false;
            console.log("refresh page to ", url );
            
            $(".panel").each(function(){
                
                var n = $(".panel-body", this).attr("id"); 
                
                $(this).removeClass("panel-success").addClass("panel-info");
                $(".panel-body", this).load( $(".panel-body", this).attr("data-source"), function(){
                
                    Admin.activate("#"+n);
                
                } );
                
            });
            
            
        },
        forms: 0,
        success: 0,
        redirect: "",
        submitting: false
    }
}

// trigger the whole thing
Admin.init();


function searchPageControls( ID, data ) {
    
    console.log(data);
    
    $(ID+" .norefresh .attributes .form-group").addClass("hide");
    
    for( line in data )
    {
        var item = $(ID+" .norefresh .attributes #"+ data[line][1]).parents(".form-group");
        
        console.log((ID+" .norefresh .attributes "+ data[line][1]));
        
        item.removeClass("hide");
    }
    
    //$(ID+" .norefresh .attributes")
}




// Helper Functions
function detectEl( ID ){ return $(ID).length > 0 ? true : false; }

function makeArrayAndSortBy( object, sort ) {
    var array = [];
    for (var item in object)
        array.push([item, object[item]])
    
    array.sort(function(a, b) {
        return a[1][sort] - b[1][sort];
    });
    
    return array;
}

window.addEventListener('popstate', function (event) { console.log(event); });



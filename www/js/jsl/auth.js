define(["FS","md5"], function (FS,md5) {
    Auth={
        check:function () {
            var self=this;
            //console.log("CHK");
            return $.when(
                $.get("login.php?curclass="+Math.random()),
                $.get("login.php?curuser="+Math.random())
            ).then(function (c,u) {
                //console.log("CHKE",c[0],u[0]);
                self.login(c[0],u[0]);
                return self;
            });
        },
        loggedIn:function () {
            return (typeof this.class)==="string" && this.class.length>0 &&
                   (typeof this.user) ==="string" && this.user.length>0;
        },
        login:function (_class,user) {
            this.class=_class;
            this.user=user;
        },
        localProjects:function ( ){
            return FS.get("/home/").rel(this.class+"/").rel(this.user+"/") //changeHOME(1)
            //return FS.resolve("${tonyuHome}/Projects/");//changeHOME
        },
        remoteProjects: function () {
            return FS.get("/home/").rel(this.class+"/").rel(this.user+"/") //changeHOME(1)
            //return FS.get("/");//changeHOME
        },
        genHash:function (projectName) {
            return md5(this.class+"/"+this.user+"/"+projectName).substring(0,8)+"/";
        },
        publishedDir: function (projectName) {
            return FS.get("/pub/"+this.genHash(projectName));
            //return this.remotePublics().rel(projectName);
        },
        publishedURL: function (projectName) {
            return WebSite.published+this.genHash(projectName);
            // http://localhost/fs/home/0123/dolittle/public/Turtle2/Raw_k6.html
            //return WebSite.published+this.class+"/"+this.user+"/public/"+projectName;
        },
        remotePublics: function () {
            return this.remoteProjects().rel("public/"); //changeHOME(1)
            //return FS.get("/public/");//changeHOME
        }
    };
    return Auth;
});
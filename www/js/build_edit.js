({
    name: 'jsl_edit',
    out: 'gen/edit_concat.js',
    optimize:"none",
    baseUrl: ".",
    paths: (function () {
        var conf=nodeRequire(process.cwd()+"/reqConf.js");
        return conf.conf.paths;
     })(),
    shim: (function () {
        var conf=nodeRequire(process.cwd()+"/reqConf.js");
        return conf.conf.shim;
     })()
})

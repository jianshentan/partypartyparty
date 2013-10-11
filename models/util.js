/* parse date 
 * expects: "yyyy-mm-dd hh:mm:ss";
 * returns: [yyyy, mm, dd, hh, mm, ss] *note that month is between 0-11
 */
exports.checkDate = function(d) {
    var ret = d.split(/[-: ]/);
    for (var i in ret)
        if (!isNumeric(ret[i]))
            return null;
    ret[1] = (parseInt(ret[1]) - 1).toString();
    if (ret.length != 6) { return null; }
    return ret;
};

function isNumeric(n) {
    return !isNaN(parseFloat(n)) && isFinite(n);
}

exports.handleError = function(msg, err) {
    console.log("ERROR " + msg + ": " + err);
    return;
};

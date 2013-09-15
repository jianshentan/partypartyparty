/* parse date 
 * expects: "yyyy-mm-dd hh:mm:ss";
 * returns: [yyyy, mm, dd, hh, mm, ss] *note that month is between 0-11
 */
exports.parseDate = function(d) {
    var ret = d.split(/[-: ]/);
    ret[1] = (parseInt(ret[1]) - 1).toString();
    if (ret.length != 6) { return null; }
    return ret;
};

exports.handleError = function(msg, err) {
    console.log("ERROR " + msg + ": " + err);
    return;
};

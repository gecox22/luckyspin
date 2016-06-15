/** Credits - Do not edit/remove this comment (Read http://domain.name/LICENSE)
 * @desc game's core source file
 * @author Dexon <dexon@live.ca> (https://github.com/Dexon95)
 * @contributors 
 */

/** Specify if this version got modified
 * @version Official source (https://github.com/gecox22/luckyspin)
 */

var socket;
var users = 0;
var Hash = "";
var showingrecaptcha = false;
var boardHtml = "";
var user_balance = 0;
var claimedTime = false;
var faucetTimer;
var access_token = null;

if(typeof $.cookie('faucetClaim') === "undefined"){
    claimedTime = false;
    $.cookie('faucetClaim', claimedTime);
}else{
    claimedTime = parseInt($.cookie('faucetClaim'));
    if(claimedTime && claimedTime > 0){
        faucetTimer = setInterval(function(){
            if(parseInt(claimedTime)+300000<=(new Date()).getTime()){
                $('#faucetButton').removeClass("claimed");
                clearInterval(faucetTimer);
                claimedTime = false;
                $('#faucetButton').attr("disabled", false);
                $('#faucetButton').text("FAUCET");
                
                if($.cookie('faucetClaim') != "undefined") $.removeCookie('faucetClaim');
                $.cookie('faucetClaim', claimedTime);
                
                return;
            }else{
                $('#faucetButton').attr("disabled", true);
                $('#faucetButton').addClass("claimed");
                $('#faucetButton').text(parseFloat( 300-(((new Date()).getTime()-claimedTime)/1000) ).formatMoney(2,'.',','));
            }
        }, 100);
    }
}

if(typeof $.cookie('gameBet') === "undefined"){
    var betSave = 2;
    $.cookie('gameBet', betSave);
}else{
    var betSave = $.cookie('gameBet');
}

if(typeof $.cookie('gameCircle') === "undefined"){
    var circleSave = 0;
    $.cookie('gameCircle', circleSave);
}else{
    var circleSave = $.cookie('gameCircle');
}

var connected = false;

if(typeof $.cookie('clientSeed') === "undefined"){
    var array = new Uint32Array(1);
    var clientSeed = window.crypto.getRandomValues(array)[0];
    $.cookie('clientSeed', clientSeed);
}else{
    var clientSeed = $.cookie('clientSeed');
}

var game = {
    bet: parseFloat(betSave),
    circle: parseInt(circleSave),
    clientSeed: clientSeed
};

$("#bet").val(game.bet);

function setBet(x){
    game.bet =  parseFloat(parseFloat(x).toFixed(2));
    betSave = game.bet;
    if($.cookie('gameBet') != "undefined") $.removeCookie('gameBet');
    $.cookie('gameBet', betSave);
}

function setCircle(x){
    game.circle = Math.floor(parseFloat(x));
    circleSave = game.circle;
    if($.cookie('gameCircle') != "undefined") $.removeCookie('gameCircle');
    $.cookie('gameCircle', game.circle);
}

function setClientSeed(x){
    game.clientSeed = parseFloat(x);
    if($.cookie('clientSeed') != "undefined") $.removeCookie('clientSeed');
    $.cookie('clientSeed', game.clientSeed);
}

$(function(){
    if(typeof $.session.get('session_access_token') != "undefined"){
        access_token = $.session.get('session_access_token');
    }

    if(getURLParameter('access_token')!="" && getURLParameter('access_token')!=null){
        access_token = getURLParameter('access_token');
        if(typeof $.session.get('session_access_token') != "undefined") $.session.remove('session_access_token');
        $.session.set('session_access_token', access_token);
        window.history.pushState('', 'Luckyspin', '/');
    }

    // https://blog.moneypot.com/introducing-socketpot/
    socket = io('https://socket.moneypot.com');
    var config = {
        app_id: 1269,
        access_token: ((access_token!="" && access_token!=null)?access_token:undefined),
        subscriptions: ['CHAT', 'DEPOSITS', 'BETS']
    };

    socket.on('connect', function() {
        console.info('[socketpot] connected');
        var authRequest = {
            app_id: config.app_id,
            access_token: config.access_token,
            subscriptions: config.subscriptions
        };
        socket.emit('auth', authRequest, function(err, authResponse) {
            if (err) {
                console.error('[auth] Error:', err);
                return;
            }
            var authData = authResponse;
            if(access_token!="" && access_token!=null){
                connected = true;
                $.getJSON("https://api.moneypot.com/v1/token?access_token="+access_token, function(json){
                    user_balance = (json.auth.user.balance/100);
                    $('.login_button').text(json.auth.user.uname);
                    $('.login_button').mouseenter(function(){
                        $('.login_button').text("Sign Out");
                    });
                    $('.login_button').mouseleave(function(){
                        $('.login_button').text(json.auth.user.uname);
                    });
                    $('.login_button').click(function(){
                        if(typeof $.session.get('session_access_token') != "undefined") $.session.remove('session_access_token');
                        window.location.href = "/";
                    });
                    $('.balance-result').text((json.auth.user.balance/100).formatMoney(2,'.',',')+" Bits");
                });

                $.getJSON("https://api.moneypot.com/v1/list-bets?access_token="+access_token+"&app_id=1269&order_by=asc", function(json){
                    var table = document.getElementById("bet_history");

                    $.each(json, function(ndx, data){
                        var row = table.insertRow(0);
                        row.id = "bet_"+data.id;
                        row.className = "bets_log_item";

                        var cell1 = row.insertCell(0);
                        var cell2 = row.insertCell(1);
                        var cell3 = row.insertCell(2);
                        var cell4 = row.insertCell(3);
                        var cell5 = row.insertCell(4);

                        cell1.innerHTML = "<a href=\"https://www.moneypot.com/bets/"+data.id+"\" target=\"_blank\">"+data.id+"</a>";

                        cell2.innerHTML = "<b><a class=\"bets_log_item_username\" href=\"https://www.moneypot.com/users/"+data.uname+"\" target\"_blank\">"+data.uname+"</a></b>";

                        cell3.innerHTML = (win?(data.profit/data.wager)+"x":"0x");
                        cell3.className = "table-result "+(data.profit>0?"up":(data.profit<0?"down":"equal"));

                        cell4.innerHTML = data.wager+" Bits";

                        cell5.innerHTML = data.profit+" Bits";
                        cell5.className = (data.profit>0?"win":(data.profit<0?"lose":"equal"));

                        $('.bets_log_item').each(function(index){
                            if(index>100) $(this).remove();
                        });
                    });
                });
            }

            users = ObjectLength(authData.chat.userlist);
        });

        socket.on('user_joined', function(data) {
            users++;
            $("#connectedUsersAmount").text(users);
            console.log(data.uname+" joined the chat. ("+users+" users online)");
        });
        socket.on('user_left', function(data) {
            users--;
            $("#connectedUsersAmount").text(users);
            console.log(data.uname+" left the chat. ("+users+" users online)");
        });

        socket.on('new_bet', function(payload) {
            var table = document.getElementById("bet_history");

            var row = table.insertRow(0);
            row.id = "bet_"+payload.id;
            row.className = "bets_log_item";

            var cell1 = row.insertCell(0);
            var cell2 = row.insertCell(1);
            var cell3 = row.insertCell(2);
            var cell4 = row.insertCell(3);
            var cell5 = row.insertCell(4);

            cell1.innerHTML = "<a href=\"https://www.moneypot.com/bets/"+payload.id+"\" target=\"_blank\">"+payload.id+"</a>";

            cell2.innerHTML = "<b><a class=\"bets_log_item_username\" href=\"https://www.moneypot.com/users/"+payload.uname+"\" target\"_blank\">"+data.uname+"</a></b>";

            cell3.innerHTML = (win?(payload.profit/payload.wager)+"x":"0x");
            cell3.className = "table-result "+(payload.profit>0?"up":(payload.profit<0?"down":"equal"));

            cell4.innerHTML = payload.wager+" Bits";

            cell5.innerHTML = payload.profit+" Bits";
            cell5.className = (payload.profit>0?"win":(payload.profit<0?"lose":"equal"));

            $('.bets_log_item').each(function(index){
                if(index>100) $(this).remove();
            });
        });

        socket.on('balance_change', function(payload) {
            $('.balance-result').text((payload.balance/100).formatMoney(2,'.',',')+" Bits");
            user_balance = (payload.balance/100);
        });
    });
});

function getURLParameter(name) {
  return decodeURIComponent((new RegExp('[#|&]' + name + '=' + '([^&;]+?)(&|#|;|$)').exec(location.hash)||[,""])[1].replace(/\+/g, '%20'))||null
}

function ObjectLength( object ) {
    var length = 0;
    for( var key in object ) {
        if( object.hasOwnProperty(key) ) {
            ++length;
        }
    }
    return length;
};

function SPIN(){
    if(!connected) return;
    var bet = (game.bet>0?game.bet:1);
    var circle = (game.circle===parseInt(game.circle)?game.circle:0);

    var houseEdge = 0.01; // 1% - 1.00 means 100%

    if(!Hash || Hash == ""){
        $.post("https://api.moneypot.com/v1/hashes?access_token="+access_token, '', function(json) {
            console.log("[Provably fair] We received our first hash: "+json.hash);
            Hash = (typeof json.hash === "undefined"?false:json.hash);
        });
    }

    if(game.circle == 0){
        var odd = ((1-houseEdge) * bet) / (n-bet);
        game.payouts = [
            {from: 0, to: 1, value: (wager*0.5)}, // 0.5x
            {from: 0, to: 1, value: (wager*0.5)}, // 0.5x
            {from: 0, to: 1, value: (wager*0.5)}, // 0.5x
            {from: 0, to: 1, value: (wager*0.5)}, // 0.5x
            {from: 0, to: 1, value: (wager*1.25)}, // 1.25x
            {from: 0, to: 1, value: (wager*1.25)}, // 1.25x
            {from: 0, to: 1, value: (wager*1.25)}, // 1.25x
            {from: 0, to: 1, value: (wager*1.25)}, // 1.25x
            {from: 0, to: 1, value: (wager*2)}, // 2x
            {from: 0, to: 1, value: (wager*2)}, // 2x
            {from: 0, to: 1, value: (wager*3)}, // 3x
            {from: rangeWin, to: Math.pow(2,32), value: 0}
        ];
    }else if(game.circle == 1){
        game.payouts = [
            {from: 0, to: rangeWin, value: ((game.stake+game.next)*100)},
            {from: rangeWin, to: Math.pow(2,32), value: 0}
        ];
    }else if(game.circle == 2){
        game.payouts = [
            {from: 0, to: rangeWin, value: ((game.stake+game.next)*100)},
            {from: rangeWin, to: Math.pow(2,32), value: 0}
        ];
    }else if(game.circle == 3){
        game.payouts = [
            {from: 0, to: rangeWin, value: ((game.stake+game.next)*100)},
            {from: rangeWin, to: Math.pow(2,32), value: 0}
        ];
    }


    user_balance -= game.bet;
    $('.balance-result').text((user_balance).formatMoney(2,'.',','));

    var wager = (game.bet*100);
    // 
    // winProb * profitIfWin + (1-winProb) * profitIfLose = EV
    // 
    $.ajax({
        type: "POST",
        contentType: "application/json",
        url: "https://api.moneypot.com/v1/bets/custom?access_token="+access_token,
        data: JSON.stringify({
            client_seed: parseInt(game.clientSeed),
            hash: String(Hash),
            wager: wager,
            "payouts": game.payouts
        }),
        dataType: "json",
        error: function(xhr, status, error) {
            console.error("[BET ERROR]",xhr.responseText);
        }
    }).done(function(data){
        if(data.next_hash){
            console.log("[Provably fair] new hash: "+data.next_hash);
            Hash = data.next_hash;

            if(data.profit < 0){ // lost

            }else{ // win

            }
        }else{
            console.error("[BET ERROR]", data);
        }
    });

}

Number.prototype.formatMoney = function(c, d, t){
    var n = this, 
        c = isNaN(c = Math.abs(c)) ? 2 : c, 
        d = d == undefined ? "." : d, 
        t = t == undefined ? "," : t, 
        s = n < 0 ? "-" : "", 
        i = parseInt(n = Math.abs(+n || 0).toFixed(c)) + "", 
        j = (j = i.length) > 3 ? j % 3 : 0;
    return s + (j ? i.substr(0, j) + t : "") + i.substr(j).replace(/(\d{3})(?=\d)/g, "$1" + t) + (c ? d + Math.abs(n - i).toFixed(c).slice(2) : "");
};
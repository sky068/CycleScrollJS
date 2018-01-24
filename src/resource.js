var res = {
    HelloWorld_png : "res/HelloWorld.png",
};

var g_resources = [];
for (var i in res) {
    g_resources.push(res[i]);
}

for (var j=1; j<=10; j++) {
    g_resources.push("res/card_" + j+".png");
}

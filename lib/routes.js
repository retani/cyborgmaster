FlowRouter.route('/', {
    name: "home",
    action: function(params) {
      BlazeLayout.render("home");

    }
});

FlowRouter.route('/player/:id', {
    name: "player",
    action: function(params) {
      console.log(params.id)
      BlazeLayout.render("player");
      playerId = params.id
    }
});

FlowRouter.route('/master', {
    name: "master",
    action: function(params) {
      BlazeLayout.render("master");
    }
});

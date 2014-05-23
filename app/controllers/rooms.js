//
// Rooms Controller
//

module.exports = function() {
    var app = this.app,
        middlewares = this.middlewares,
        models = this.models;

    //
    // Routes
    //
    app.get('/rooms', middlewares.requireLogin, function(req, res) {
        req.io.route('rooms:list');
    });
    app.post('/rooms', middlewares.requireLogin, function(req, res) {
        req.io.route('rooms:create');
    });

    //
    // Sockets
    //
    app.io.route('rooms', {
        create: function(req) {
            var data = req.data || req.body;
            models.room.create({
                owner: req.user._id,
                name: data.name,
                description: data.description
            }, function(err, room) {
                if (err) {
                    console.error(err);
                    req.io.respond(err, 400);
                    return;
                }
                req.io.respond(room, 201);
                app.io.broadcast('rooms:new', room);
            });
        },
        list: function(req) {
            models.room
                .find()
                .exec(function(err, rooms) {
                if (err) {
                    console.error(err);
                    req.io.respond(err, 400);
                    return;
                }
                req.io.respond(rooms);
            });
        },
        users: function getRoomUsers(req) {
            var id = req.data;
            console.log('make userlist...');
        },
        join: function(req) {
            var id = req.data;
            models.room.findById(id, function(err, room) {
                if (err) {
                    // Problem? TODO: Figure out how to recover?
                    console.error(err);
                    return;
                }
                if (!room) {
                    // No room, no effect
                    console.error('No room!');
                    req.io.respond();
                    return;
                }
                req.io.join(room._id);
                req.io.respond(room.toJSON());
            })
        },
        leave: function(req) {
            var id = req.data;
            req.io.leave(id);
            req.io.respond();
        },
    });
}
const express = require('express');
const app = express();
const config = require('./config/config.json');
const { mongoose } = require('./db/mongoose');
const jwt = require('jsonwebtoken');

const bodyParser = require('body-parser');

/* Models */
const { List, Task, User } = require('./db/models/index');
const { request, response } = require('express');
const { result } = require('lodash');

/** Middleware */
app.use(bodyParser.json());

//Enable CORS
// CORS HEADERS MIDDLEWARE
app.use(function (req, res, next) {
    res.header("Access-Control-Allow-Origin", config.clientUrl);
    res.header("Access-Control-Allow-Methods", config.corsAllowedMethods);
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, x-access-token, x-refresh-token, _id");

    res.header(
        'Access-Control-Expose-Headers',
        'x-access-token, x-refresh-token'
    );

    next();
});

// check whether the request has a valid JWT access token
let authenticate = (req, res, next) => {
    let token = req.header('x-access-token');

    // verify the JWT
    jwt.verify(token, User.getJWTSecret(), (err, decoded) => {
        if (err) {
            res.status(401).send(err);
        } else {
            req.user_id = decoded._id;
            next();
        }
    });
}

// Verify Refresh Token Middleware
let verifySession = (req, res, next) => {
    let refreshToken = req.header('x-refresh-token');
    let _id = req.header('_id');

    User.findByIdAndToken(_id, refreshToken).then((user) => {
        if (!user) {
            return Promise.reject({
                'error': 'User not found. Make sure that the refresh token and user id are correct'
            });
        }

        req.user_id = user._id;
        req.userObject = user;
        req.refreshToken = refreshToken;

        let isSessionValid = false;

        user.sessions.forEach((session) => {
            if (session.token === refreshToken) {
                if (User.hasRefreshTokenExpired(session.expiresAt) === false) {
                    isSessionValid = true;
                }
            }
        });

        if (isSessionValid) {
            next();
        } else {
            return Promise.reject({
                'error': 'Refresh token has expired or the session is invalid'
            })
        }
    }).catch((e) => {
        res.status(401).send(e);
    })
}
/** Middleware */

/* Route Handlers */
/* Lists Endpoints */
/**
 * GET /lists
 * Purpose: Get all lists from the database;
*/
app.get('/lists', authenticate, (request, response) => {
    List.find({
        _userId: request.user_id
    })
        .then((lists) => {
            response.send(lists);
        }).catch((error) => {
            response.send(error);
        });
});

/**
 * POST /lists
 * Purpose: Create a new list and return the id of the newly created list;
*/
app.post('/lists', authenticate, (request, response) => {
    let title = request.body.title;

    let newList = new List({
        title,
        _userId: request.user_id
    });

    newList.save().then((listDocument) => {
        response.send(listDocument);
    });
});

/**
 * PATCH /lists
 * Purpose: Update a list;
*/
app.patch('/lists/:id', authenticate, (request, response) => {
    List.findOneAndUpdate({ _id: request.params.id, _userId: request.user_id }, {
        $set: request.body
    })
        .then(() => {
            response.send({ message: 'Updated!' });
            // response.sendStatus(200);
        });
});

/**
 * DELETE /lists
 * Purpose: Delete a list;
*/
app.delete('/lists/:id', authenticate, (request, response) => {
    List.findOneAndRemove({
        _id: request.params.id,
        _userId: request.user_id
    }).then((removeListDocument) => {
        response.send(removeListDocument);
        deleteTaskFromList(removeListDocument._id);
    });
});
/* Lists Endpoints */

/* Task Endpoints */
/**
 * GET /lists/:listId/tasks
 * Purpose: Get all task in specific list;
*/
app.get('/lists/:listId/tasks', authenticate, (request, response) => {
    Task.find({
        _listId: request.params.listId
    }).then((tasks) => {
        response.send(tasks);
    });
});

app.get('/lists/:listId/tasks/:taskId', authenticate, (request, response) => {
    Task.findOne({
        _id: request.params.taskId,
        _listId: request.params.listId
    }).then((task) => {
        response.send(task);
    });
});

/**
 * POST /lists/:listId/tasks
 * Purpose: Create a task in a specific list;
*/
app.post('/lists/:listId/tasks', authenticate, (request, response) => {
    List.findOne({
        _id: request.params.listId,
        _userId: request.user_id
    }).then((list) => {
        if (list) {
            return true;
        } else {
            return false;
        }
    }).then((canCreateTask) => {
        if (canCreateTask) {
            let newTask = new Task({
                title: request.body.title,
                _listId: request.params.listId
            });

            newTask.save().then((newTaskDocument) => {
                response.send(newTaskDocument);
            });
        } else {
            response.sendStatus(404);
        }

    });
});

/**
 * PATCH /lists/:listId/tasks/:taskId
 * Purpose: Update a spacific task in a specific list; * 
*/

app.patch('/lists/:listId/tasks/:taskId', authenticate, (request, response) => {
    List.findOne({
        _id: request.params.listId,
        _userId: request.user_id
    }).then((list) => {
        if (list) {
            return true;
        } else {
            return false;
        }
    }).then((canUpdateTask) => {
        if (canUpdateTask) {
            Task.findOneAndUpdate({
                _id: request.params.taskId,
                _listId: request.params.listId
            }, {
                $set: request.body
            }).then(() => {
                response.send({ message: "Updated successfully!" });
            });
        } else {
            response.sendStatus(404);
        }
    });
});

/**
 * DELETE /lists/:listId/tasks/:taskId
 * Purpose: Delete a task in a specific list;
*/
app.delete('/lists/:listId/tasks/:taskId', authenticate, (request, response) => {
    List.findOne({
        _id: request.params.listId,
        _userId: request.user_id
    }).then((list) => {
        if (list) {
            return true;
        } else {
            return false;
        }
    }).then((canDeleteTask) => {
        if (canDeleteTask) {
            Task.findOneAndRemove({
                _id: request.params.taskId,
                _listId: request.params.listId
            }).then((removeTaskDocument) => {
                response.send(removeTaskDocument);
            });
        } else {
            response.sendStatus(404);
        }
    })
});
/* Task Endpoints */

/* User Endpoints */
/**
 * POST /users/sign-up
 * Purpose: Sign up a User
 */
app.post('/users/sign-up', (req, res) => {
    let body = req.body;
    let newUser = new User(body);

    newUser.save().then(() => {
        return newUser.createSession();
    }).then((refreshToken) => {
        return newUser.generateAccessAuthToken().then((accessToken) => {
            return { accessToken, refreshToken }
        });
    }).then((authTokens) => {
        res
            .header('x-refresh-token', authTokens.refreshToken)
            .header('x-access-token', authTokens.accessToken)
            .send(newUser);
    }).catch((e) => {
        res.status(400).send(e);
    })
});

/**
 * POST /users/sign-in
 * Purpose: 
 */
app.post('/users/sign-in', (req, res) => {
    let email = req.body.email;
    let password = req.body.password;

    User.findByCredentials(email, password).then((user) => {
        return user.createSession().then((refreshToken) => {
            return user.generateAccessAuthToken().then((accessToken) => {
                return { accessToken, refreshToken }
            });
        }).then((authTokens) => {
            res
                .header('x-refresh-token', authTokens.refreshToken)
                .header('x-access-token', authTokens.accessToken)
                .send(user);
        })
    }).catch((e) => {
        res.status(400).send(e);
    });
});

/**
 * GET /users/me/access-token
 * Purpose: generates and returns an access token
 */
app.get('/users/me/access-token', verifySession, (req, res) => {
    req.userObject.generateAccessAuthToken().then((accessToken) => {
        res.header('x-access-token', accessToken).send({ accessToken });
    }).catch((e) => {
        res.status(400).send(e);
    });
})
/* User Endpoints */

/** Helper Methods */
let deleteTaskFromList = (_listId) => {
    Task.deleteMany({
        _listId
    }).then(() => {
        console.log("Tasks from " + _listId + " were deleted!");
    });
}

/* Route Handlers */

app.listen(config.apiServePort, () => {
    console.log('Server is listening on port 3000!');
});
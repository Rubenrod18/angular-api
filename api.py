# -*- coding: utf-8 -*-
from bson import json_util
from flask import Flask, request, render_template, url_for, redirect, session
from flask.ext.login import LoginManager, login_required, current_user
from flask.ext.mail import Mail, Message
from flask.ext.mongoengine import MongoEngine
from flask.ext.security import Security, MongoEngineUserDatastore, UserMixin, RoleMixin, login_user, roles_required, \
    roles_accepted
from flask.ext.wtf import Form
from mongoengine import DoesNotExist
from random import randint, choice
from werkzeug.security import check_password_hash, generate_password_hash
from wtforms import StringField, SubmitField, BooleanField, PasswordField
import datetime
import logging
import string
import unicodedata

app = Flask(__name__)

login_manager = LoginManager()
login_manager.init_app(app)

logger = logging.getLogger(__name__)
logging.info('Starting logger...')

@app.config.from_object
class Config(object):
    SECRET_KEY                        = 'top-secret'

    SECURITY_POST_LOGIN_VIEW          = '/users'
    SECURITY_UNAUTHORIZED_VIEW        = '/users'

    SECURITY_USER_IDENTITY_ATTRIBUTES = 'username'
    SECURITY_REGISTRABLE              = False

    MONGODB_HOST                      = '127.0.0.1'
    MONGODB_PORT                      = 27017
    MONGODB_DB                        = 'dbname'

    MAIL_SERVER                       = 'smtp.gmail.com'
    MAIL_PORT                         = 465
    MAIL_USE_SSL                      = True
    MAIL_USE_TLS                      = False
    MAIL_USERNAME                     = 'email@gmail.com'
    MAIL_PASSWORD                     = 'password'
    MAIL_DEFAULT_SENDER               = 'email@gmail.com'

mail = Mail(app)

# Create database connection object
db = MongoEngine(app)

class Role(db.Document, RoleMixin):
    name = db.StringField(max_length=80, unique=True)
    description = db.StringField(max_length=255)

class User(db.Document, UserMixin):
    meta = {
        'allow_inheritance': False,
        'indexes': [
            {
                'fields' : {'$name', '$last_name', '$email', '$username'}
            }
        ]
    }
    name = db.StringField(max_length=255)
    last_name = db.StringField(max_length=255)
    username = db.StringField(max_length=255, unique=True)
    password = db.StringField(max_length=255)
    gender = db.StringField(max_length=255)
    dni = db.StringField(max_length=9)
    birth_date = db.StringField(max_length=10)
    email = db.StringField(max_length=255)
    created_at = db.DateTimeField(default=datetime.datetime.utcnow())
    active = db.BooleanField(default=True)
    roles = db.ListField(db.ReferenceField(Role), default=[])

    def check_password(self, password):
        return check_password_hash(self.password, password)

def remove_accents(data):
    return ''.join(x for x in unicodedata.normalize('NFKD', data) if x in string.ascii_letters).lower()

def password_generator(size=6, chars=string.ascii_uppercase + string.digits):
    return ''.join(choice(chars) for _ in range(size))

def generate_username(username):
    user_username = '.'.join([remove_accents(data) for data in username])
    exists = True
    while exists == True:
        try:
            User.objects.get(username=user_username)
            exists = True
        except DoesNotExist as e:
            exists = False
        if exists == True:
            user_username += str(randint(1, 99))
    return user_username

class LoginForm(Form):
    username = StringField('Username')
    password = PasswordField('Password')
    submit = SubmitField('Login')
    remember = BooleanField('Remember')
    next = BooleanField('Next')

    def __init__(self, *args, **kwargs):
        Form.__init__(self, *args, **kwargs)
        self.user = None

    def validate(self):
        rv = Form.validate(self)
        if not rv:
            return False

        try:
            user = User.objects.get(username=self.username.data)
        except DoesNotExist:
            user = None

        if user is None:
            self.username.errors.append('Unknown username')
            return False

        if not user.check_password(self.password.data):
            self.password.errors.append('Invalid password')
            return False

        self.user = user
        return True

# Setup Flask-Security
user_datastore = MongoEngineUserDatastore(db, User, Role)
security = Security(app, user_datastore, login_form=LoginForm)

@app.before_first_request
def initial_data():
    try:
        User.objects.get(username='admin')
    except DoesNotExist as e:
        user_datastore.create_role(name='create', description='Create users')
        user_datastore.create_role(name='update', description='Update users')
        user_datastore.create_role(name='delete', description='Delete users')

        user_datastore.create_user(username='admin', password=generate_password_hash('admin', method='pbkdf2:sha512'))
        user_datastore.add_role_to_user(User.objects.get(username='admin'), Role.objects.get(name='create'))
        user_datastore.add_role_to_user(User.objects.get(username='admin'), Role.objects.get(name='update'))
        user_datastore.add_role_to_user(User.objects.get(username='admin'), Role.objects.get(name='delete'))

@app.after_request
def after_request(response):
    response.headers.add('Access-Control-Allow-Origin', '*')
    response.headers.add('Access-Control-Allow-Headers', 'Content-Type, Authorization')
    response.headers.add('Access-Control-Allow-Methods', 'GET, PUT, POST, DELETE')
    return response

@app.route('/')
@login_required
@roles_required('create')
def root_path():
    roles = [data.to_mongo().to_dict() for data in Role.objects().exclude('id')]
    return render_template('index.html', roles=roles)

@app.route('/login', methods=['GET', 'POST'])
def login():
    form = LoginForm()
    if form.validate_on_submit():
        username = request.form['username']
        password = request.form['password']
        session['user_id'] = form.user.id
        user = User.objects.filter(username=username, password=password).get()
        login_user(user, remember=False)
        return redirect(url_for('/user'))
    return render_template('security/login_user.html', login=form)

@app.route('/auth/logout')
@login_required
def logout():
    session.clear()
    return redirect(url_for('login'))

@app.route("/users/user", methods=['POST'])
@login_required
@roles_required('create')
def create_user():
    data = request.json
    try:
        if not 'dni' in data:
            data['dni'] = ''
        if not 'gender' in data:
            data['gender'] = 'unknown'
        password = password_generator()
        user = User(
            name = data['name'],
            last_name = data['last_name'],
            username = generate_username([data['name'], data['last_name']]),
            password = generate_password_hash(password, method='pbkdf2:sha512'),
            gender = data['gender'],
            dni = data['dni'],
            birth_date = data['birth_date'],
            email = data['email']
        ) # User
        for role in data['roles']:
            if data['roles'][role] == True:
                user_datastore.add_role_to_user(user, Role.objects.get(name=role))
        user.save()

        message = '{html}'.format(
             html = u'Dear ' + user.name.capitalize() + ' ' + user.last_name.capitalize() + ',<br/>'
                +'Welcome! Thanks for signing up. Here you are your data for sign in.<br/>'
                +'<p>username: <strong>' + user.username + '</strong></p>'
                +'<p>password: <strong>' + password + '</strong></p>'
                +'Regards'
        ) # format
        subject = '{subject}'.format(
            subject = u'Hello, %s ' % user.name.capitalize()
        ) # format

        msg = Message(recipients=[user.email], html=message, subject=subject)
        mail.send(msg)
    except Exception as e:
        logger.exception(e)
        return '', 500
    return '', 200

@app.route("/users", methods=['GET'])
@login_required
def users():
    params = request.args
    if not params:
        return render_template('users.html')
    else:
        required = {'page', 'limit', 'search'}
        values = {key: params[key] for key in params if key in required}
        users = []
        try:
            values['limit'] = int(values['limit'])
            values['page'] = int(values['page'])
            if not 'search' in values:
                cursor = User.objects.exclude('id', 'password').skip(values['page']*values['limit']).limit(values['limit'])
            else:
                cursor = User.objects.search_text(values['search']).exclude('id').exclude('password').skip(values['page']*values['limit']).limit(values['limit'])
            if cursor.count() > 0:
                users = [data.to_mongo().to_dict() for data in cursor]
                users.insert(0, cursor.count())
        except Exception as e:
            logger.exception(e)
            return '', 500
        return json_util.dumps(users), 200

@app.route("/users/<user_username>", methods=['DELETE', 'PUT'])
@login_required
@roles_accepted('delete', 'update')
def get_user(user_username):
    requiredFields = {'name', 'last_name', 'gender', 'dni', 'email', 'birth_date', 'username'}
    if request.method == 'DELETE' and current_user.has_role('delete'):
        try:
            User.objects.get(username=user_username).delete()
        except Exception as e:
            logger.exception(e)
            return '', 500
        return '', 200
    elif request.method == 'PUT' and current_user.has_role('update'):
        data = request.json
        data = {key: data[key] for key in data if key in requiredFields}
        del data['username']
        try:
            User.objects(username=user_username).update(upsert=False, multi=False, write_concern=None, full_result=True, **data)
        except Exception as e:
            logger.exception(e)
            return '', 500
        return '', 200

if __name__ == "__main__":
    app.run(host='dev.localhost', debug=True)

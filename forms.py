from flask.ext.wtf import Form
from wtforms import StringField, BooleanField, SubmitField
from wtforms.validators import Required

class NicknameLogin(Form):
    username = StringField('Username',  validators=[Required()])
    password = StringField('Password',  validators=[Required()])
    remember = BooleanField('Remember')
    submit = SubmitField('Submit')

    def validate(self):
        rv = Form.validate(self)
        if not rv:
            return False
        self.user = self
        return True
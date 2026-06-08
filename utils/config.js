require('dotenv').config();

const ORG_NAME = process.env.ORG_NAME || 'SUD';
const ORG_SHORT = process.env.ORG_SHORT || 'SUD';
const ORG_GENITIVE = process.env.ORG_GENITIVE || 'suda';
const ORG_ACCUSATIVE = process.env.ORG_ACCUSATIVE || 'sud';
const ORG_LOCATIVE = process.env.ORG_LOCATIVE || 'sudu';

const DB_PREFIX = process.env.DB_PREFIX || 'sud_';

// Uloge dozvoljene za administratorske/upravne komande (npr. 'director', 'zamenik nacelnika', itd.)
const ALLOWED_ROLES = (process.env.ALLOWED_ROLES || 'director,zamenik nacelnika,predsednik suda,zamenik predsednika,sudija')
    .split(',')
    .map(role => role.trim().toLowerCase())
    .filter(Boolean);

// Osnovna rola člana organizacije
const MEMBER_ROLE = (process.env.MEMBER_ROLE || 'član suda').toLowerCase();

module.exports = {
    ORG_NAME,
    ORG_SHORT,
    ORG_GENITIVE,
    ORG_ACCUSATIVE,
    ORG_LOCATIVE,
    DB_PREFIX,
    ALLOWED_ROLES,
    MEMBER_ROLE
};

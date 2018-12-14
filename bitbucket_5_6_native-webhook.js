/*jshint esversion: 6 */

const config = {
    colorDefault: '#225159',
    colorError: '#8D2A12',
    colorSuccess: '#14720a',
    bitbucketUrl: 'configure me ;-)'
};

const showNotifications = {
    'repo:refs_changed': true,
    'repo:forked': true,
    'repo:comment:added': true,
    'repo:comment:edited': true,
    'repo:comment:deleted': true,
    'pr:opened': true,
    'pr:reviewer:approved': true,
    'pr:reviewer:unapproved': true,
    'pr:reviewer:needs_work': true,
    'pr:merged': true,
    'pr:declined': true,
    'pr:deleted': true,
    'pr:comment:added': true,
    'pr:comment:deleted': true,
    'pr:comment:edited': true
};

function get_basic_info(content) {
    const author = {
        username: content.actor.name,
        displayname: content.actor.displayName
    };
    const repository = {
        name: content.repository.name,
        link: config.bitbucketUrl + '/projects/' + content.repository.project.key + '/repos/' + content.repository.name + '/commits'
    };
    return {
        author: author,
        repository: repository
    };
}

function create_attachement(author, text) {
    const attachment = {
        author_name: '@'+author.username,
        text: text,
        ts: new Date().toISOString()
    };
    return attachment;
}

const processors = {
    repo_refs_changed(content) {
        const info = get_basic_info(content);
        const updates = [];
        for (let change of content.changes) {
            let update = {};
            update.hash = change.toHash;
            update.link = info.repository.link + '/' + change.toHash;
            update.type = change.type;
            updates.push(update);
        }

        let text = '';
        text += "On repository " + "[" + info.repository.name + "]" + "(" + info.repository.link + ")" + ": " + "\n";
        for (let update of updates) {
            text += "*" + update.type + "* " + "[" + update.hash.toString().substring(0, 6) + "]" + "(" + update.link + ")\n";
        }

        return {
            content: {
                attachments: [create_attachement(info.author, text)],
                parseUrls: false,
                color: ((config.colorDefault !== '') ? '#' + config.colorDefault.replace('#', '') : '#225159')
            }
        };
    },

    repo_forked(content) {
        const info = get_basic_info(content);

        const fork_name = info.repository.name;
        const originlink = config.bitbucketUrl + '/projects/' + content.repository.origin.project.key + '/repos/' + content.repository.origin.name + '/commits'
        const fork_link = info.repository.link;

        let text = '';
        text += "On repository " + "[" + content.repository.origin.name + "]" + "(" + originlink + ")" + ": " + "\n";
        text += "*Forked* to " + "[" + fork_name + "]" + "(" + fork_link + ")" + "\n";

        return {
            content: {
                attachments: [create_attachement(info.author, text)],
                parseUrls: false,
                color: ((config.colorDefault !== '') ? '#' + config.colorDefault.replace('#', '') : '#225159')
            }
        };
    },

    repo_comment_added(content) {
        const info = get_basic_info(content);

        const commithash = content.commit;
        const comment = content.comment.text;

        let text = '';
        text += "On repository " + "[" + info.repository.name + "]" + "(" + info.repository.link + ")" + ": " + "\n";
        text += "*Commented* " + "[" + commithash.toString().substring(0, 6) + "]" + "(" + info.repository.link + "/" + commithash + ")\n";
        text += "_" + comment + "_\n";

        return {
            content: {
                attachments: [create_attachement(info.author, text)],
                parseUrls: false,
                color: ((config.colorDefault !== '') ? '#' + config.colorDefault.replace('#', '') : '#225159')
            }
        };
    },

    repo_comment_edited(content) {
        const info = get_basic_info(content);

        const commithash = content.commit;
        const comment = content.comment.text;

        let text = '';
        text += "On repository " + "[" + info.repository.name + "]" + "(" + info.repository.link + ")" + ": " + "\n";
        text += "*Edited Comment* " + "[" + commithash.toString().substring(0, 6) + "]" + "(" + info.repository.link + "/" + commithash + ")\n";
        text += "~" + content.previousComment + "~\n";
        text += "_" + comment + "_\n";

        return {
            content: {
                attachments: [create_attachement(info.author, text)],
                parseUrls: false,
                color: ((config.colorDefault !== '') ? '#' + config.colorDefault.replace('#', '') : '#225159')
            }
        };
    },

    repo_comment_deleted(content) {
        const info = get_basic_info(content);

        const commithash = content.commit;
        const comment = content.comment.text;

        let text = '';
        text += "On repository " + "[" + info.repository.name + "]" + "(" + info.repository.link + ")" + ": " + "\n";
        text += "*Deleted Comment* " + "[" + commithash.toString().substring(0, 6) + "]" + "(" + info.repository.link + "/" + commithash + ")\n";
        text += "~" + comment + "~\n";

        return {
            content: {
                attachments: [create_attachement(info.author, text)],
                parseUrls: false,
                color: ((config.colorDefault !== '') ? '#' + config.colorDefault.replace('#', '') : '#225159')
            }
        };
    },

    pr_opened(content) {
        const author = {
            username: content.actor.name
        };
        const pullRequest = {
            sourcebranch: content.pullRequest.fromRef.id,
            destinationbranch: content.pullRequest.toRef.id,
            projectKey: content.pullRequest.toRef.repository.project.key,
            id: content.pullRequest.id,
            sourcerepo: content.pullRequest.fromRef.repository.name,
            destrepo: content.pullRequest.toRef.repository.name,
            title: content.pullRequest.title,
            description: content.pullRequest.description ? content.pullRequest.description : ''
        };
        const links = {
            self: config.bitbucketUrl + '/projects/' + pullRequest.projectKey + '/repos/' + pullRequest.destrepo + '/pull-requests/' + pullRequest.id + '/overview'
        };
        let text = '';
        text += '@' + author.username + ' opened a new pull request:\n';
        text += '`' + pullRequest.sourcerepo + '/' + pullRequest.sourcebranch + '` => `' + pullRequest.destrepo + '/' + pullRequest.destinationbranch + '`\n\n';
        text += 'Title: (' + pullRequest.id + ') ' + pullRequest.title + '\n';
        text += 'Description:\n';
        text += pullRequest.description + '\n';
        const attachment = {
            author_name: '#' + pullRequest.id + ' - ' + pullRequest.title,
            author_link: links.self,
            ts: new Date().toISOString()
        };
        return {
            content: {
                text: text,
                attachments: [attachment],
                parseUrls: false,
                color: ((config.colorDefault !== '') ? '#' + config.colorDefault.replace('#', '') : '#225159')
            }
        };
    },


    pr_reviewer_approved(content) {
        const author = {
            username: content.actor.name
        };

        const pullrequest = {
            sourcebranch: content.pullRequest.fromRef.id,
            destinationbranch: content.pullRequest.toRef.id,
            projectKey: content.pullRequest.toRef.repository.project.key,
            id: content.pullRequest.id,
            author: content.pullRequest.author.user.name,
            sourcerepo: content.pullRequest.fromRef.repository.name,
            destrepo: content.pullRequest.toRef.repository.name,
            title: content.pullRequest.title,
            description: content.pullRequest.description ? content.pullRequest.description : ''
        };
        let text = '';
        text += '@' + author.username + ' approved pull request ' + pullrequest.id + ' from @' + pullrequest.author + ':\n';
        text += '`' + pullrequest.sourcerepo + '/' + pullrequest.sourcebranch + '` => `' + pullrequest.destrepo + '/' + pullrequest.destinationbranch + '`\n\n';
        const attachment = {
            author_name: 'APPROVED: ' + '#' + pullrequest.id + ' - ' + pullrequest.title,
            author_link: config.bitbucketUrl + '/projects/' + pullrequest.projectKey + '/repos/' + pullrequest.sourcerepo + '/pull-requests/' + pullrequest.id + '/overview',
            ts: new Date().toISOString()
        };
        return {
            content: {
                text: text,
                attachments: [attachment],
                parseUrls: false,
                color: ((config.colorDefault !== '') ? '#' + config.colorDefault.replace('#', '') : '#225159')
            }
        };
    },


    pr_reviewer_unapproved(content) {
        const author = {
            username: content.actor.name
        };

        const pullrequest = {
            sourcebranch: content.pullRequest.fromRef.id,
            destinationbranch: content.pullRequest.toRef.id,
            projectKey: content.pullRequest.toRef.repository.project.key,
            id: content.pullRequest.id,
            author: content.pullRequest.author.user.name,
            sourcerepo: content.pullRequest.fromRef.repository.name,
            destrepo: content.pullRequest.toRef.repository.name,
            title: content.pullRequest.title,
            description: content.pullRequest.description ? content.pullRequest.description : ''
        };
        let text = '';
        text += '@' + author.username + ' unapproved pull request ' + pullrequest.id + ' from @' + pullrequest.author + ':\n';
        text += '`' + pullrequest.sourcerepo + '/' + pullrequest.sourcebranch + '` => `' + pullrequest.destrepo + '/' + pullrequest.destinationbranch + '`\n\n';
        const attachment = {
            author_name: 'UNAPPROVED: ' +  '#' + pullrequest.id + ' - ' + pullrequest.title,
            author_link: config.bitbucketUrl + '/projects/' + pullrequest.projectKey + '/repos/' + pullrequest.sourcerepo + '/pull-requests/' + pullrequest.id + '/overview',
            ts: new Date().toISOString()
        };
        return {
            content: {
                text: text,
                attachments: [attachment],
                parseUrls: false,
                color: ((config.colorDefault !== '') ? '#' + config.colorDefault.replace('#', '') : '#225159')
            }
        };
    },

    pr_reviewer_needs_work(content) {
        const author = {
            username: content.actor.name
        };

        const pullrequest = {
            sourcebranch: content.pullRequest.fromRef.id,
            destinationbranch: content.pullRequest.toRef.id,
            projectKey: content.pullRequest.toRef.repository.project.key,
            id: content.pullRequest.id,
            author: content.pullRequest.author.user.name,
            sourcerepo: content.pullRequest.fromRef.repository.name,
            destrepo: content.pullRequest.toRef.repository.name,
            title: content.pullRequest.title,
            description: content.pullRequest.description ? content.pullRequest.description : ''
        };
        let text = '';
        text += '@' + author.username + ' says, pull request ' + pullrequest.id + ' from @' + pullrequest.author + ' needs work:\n';
        text += '`' + pullrequest.sourcerepo + '/' + pullrequest.sourcebranch + '` => `' + pullrequest.destrepo + '/' + pullrequest.destinationbranch + '`\n\n';
        const attachment = {
            author_name: 'NEEDS WORK: ' +  '#' + pullrequest.id + ' - ' + pullrequest.title,
            author_link: config.bitbucketUrl + '/projects/' + pullrequest.projectKey + '/repos/' + pullrequest.sourcerepo + '/pull-requests/' + pullrequest.id + '/overview',
            ts: new Date().toISOString()
        };
        return {
            content: {
                text: text,
                attachments: [attachment],
                parseUrls: false,
                color: ((config.colorError !== '') ? '#' + config.colorError.replace('#', '') : '#225159')
            }
        };
    },

    pr_merged(content) {
        const author = {
            username: content.actor.name
        };

        const pullrequest = {
            sourcebranch: content.pullRequest.fromRef.id,
            destinationbranch: content.pullRequest.toRef.id,
            projectKey: content.pullRequest.toRef.repository.project.key,
            id: content.pullRequest.id,
            author: content.pullRequest.author.user.name,
            sourcerepo: content.pullRequest.fromRef.repository.name,
            destrepo: content.pullRequest.toRef.repository.name,
            title: content.pullRequest.title,
            description: content.pullRequest.description ? content.pullRequest.description : ''
        };
        let text = '';
        text += '@' + author.username + ' merged pull request ' + pullrequest.id + ' from @' + pullrequest.author + ':\n';
        text += '`' + pullrequest.sourcerepo + '/' + pullrequest.sourcebranch + '` => `' + pullrequest.destrepo + '/' + pullrequest.destinationbranch + '`\n\n';
        const attachment = {
            author_name: 'MERGED: ' +  '#' + pullrequest.id + ' - ' + pullrequest.title,
            author_link: config.bitbucketUrl + '/projects/' + pullrequest.projectKey + '/repos/' + pullrequest.sourcerepo + '/pull-requests/' + pullrequest.id + '/overview',
            ts: new Date().toISOString()
        };
        return {
            content: {
                text: text,
                attachments: [attachment],
                parseUrls: false,
                color: ((config.colorSuccess !== '') ? '#' + config.colorSuccess.replace('#', '') : '#225159')
            }
        };
    },

    pr_declined(content) {
        const author = {
            username: content.actor.name
        };

        const pullrequest = {
            sourcebranch: content.pullRequest.fromRef.id,
            destinationbranch: content.pullRequest.toRef.id,
            projectKey: content.pullRequest.toRef.repository.project.key,
            id: content.pullRequest.id,
            author: content.pullRequest.author.user.name,
            sourcerepo: content.pullRequest.fromRef.repository.name,
            destrepo: content.pullRequest.toRef.repository.name,
            title: content.pullRequest.title,
            description: content.pullRequest.description ? content.pullRequest.description : ''
        };
        text += '@' + author.username + ' declined pull request ' + pullrequest.id + ' from @' + pullrequest.author + ':\n';
        text += '`' + pullrequest.sourcerepo + '/' + pullrequest.sourcebranch + '` => `' + pullrequest.destrepo + '/' + pullrequest.destinationbranch + '`\n\n';
        const attachment = {
            author_name: 'DECLINED: ' +  '#' + pullrequest.id + ' - ' + pullrequest.title,
            author_link: config.bitbucketUrl + '/projects/' + pullrequest.projectKey + '/repos/' + pullrequest.sourcerepo + '/pull-requests/' + pullrequest.id + '/overview',
            ts: new Date().toISOString()
        };
        return {
            content: {
                text: text,
                attachments: [attachment],
                parseUrls: false,
                color: ((config.colorError !== '') ? '#' + config.colorError.replace('#', '') : '#225159')
            }
        };
    },

    pr_deleted(content) {
        const author = {
            username: content.actor.name
        };

        const pullrequest = {
            sourcebranch: content.pullRequest.fromRef.id,
            destinationbranch: content.pullRequest.toRef.id,
            projectKey: content.pullRequest.toRef.repository.project.key,
            id: content.pullRequest.id,
            author: content.pullRequest.author.user.name,
            sourcerepo: content.pullRequest.fromRef.repository.name,
            destrepo: content.pullRequest.toRef.repository.name,
            title: content.pullRequest.title,
            description: content.pullRequest.description ? content.pullRequest.description : ''
        };
        let text = '';
        text += '@' + author.username + ' deleted pull request ' + pullrequest.id + ' from @' + pullrequest.author + ':\n';
        text += '`' + pullrequest.sourcerepo + '/' + pullrequest.sourcebranch + '` => `' + pullrequest.destrepo + '/' + pullrequest.destinationbranch + '`\n\n';
        const attachment = {
            author_name: 'DELETED: ' +  '#' + pullrequest.id + ' - ' + pullrequest.title,
            author_link: config.bitbucketUrl + '/projects/' + pullrequest.projectKey + '/repos/' + pullrequest.sourcerepo + '/pull-requests/' + pullrequest.id + '/overview',
            ts: new Date().toISOString()
        };
        return {
            content: {
                text: text,
                attachments: [attachment],
                parseUrls: false,
                color: ((config.colorError !== '') ? '#' + config.colorError.replace('#', '') : '#225159')
            }
        };
    },

    pr_comment_added(content) {
        const pullRequest = {
            projectKey: content.pullRequest.toRef.repository.project.key,
            id: content.pullRequest.id,
            repo: content.pullRequest.toRef.repository.name
        };
        const author = {
            username: content.actor.name
        };
        const comment = {
            text: content.comment.text
        };
        let text = '';
        text += '@' + author.username + ' added a comment on a pull request:\n';
        text += 'Comment:\n';
        text += '_' + comment.text + '_\n';
        const attachment = {
            author_name: content.pullRequest.title,
            author_link: config.bitbucketUrl + '/projects/' + pullRequest.projectKey + '/repos/' + pullRequest.repo + '/pull-requests/' + pullRequest.id + '/overview',
            ts: new Date().toISOString()
        };
        return {
            content: {
                text: text,
                attachments: [attachment],
                parseUrls: false,
                color: ((config.colorDefault !== '') ? '#' + config.colorDefault.replace('#', '') : '#225159')
            }
        };
    },

    pr_comment_deleted(content) {
        const pullRequest = {
            projectKey: content.pullRequest.toRef.repository.project.key,
            id: content.pullRequest.id,
            repo: content.pullRequest.toRef.repository.name
        };
        const author = {
            username: content.actor.name
        };
        const comment = {
            text: content.comment.text
        };
        let text = '';
        text += '@' + author.username + ' deleted a comment on a pull request:\n';
        text += 'Comment:\n';
        text += '~' + comment.text + '~\n';
        const attachment = {
            author_name: content.pullRequest.title,
            author_link: config.bitbucketUrl + '/projects/' + pullRequest.projectKey + '/repos/' + pullRequest.repo + '/pull-requests/' + pullRequest.id + '/overview',
            ts: new Date().toISOString()
        };
        return {
            content: {
                text: text,
                attachments: [attachment],
                parseUrls: false,
                color: ((config.colorDefault !== '') ? '#' + config.colorDefault.replace('#', '') : '#225159')
            }
        };
    },

    pr_comment_edited(content) {
        const pullRequest = {
            projectKey: content.pullRequest.toRef.repository.project.key,
            id: content.pullRequest.id,
            repo: content.pullRequest.toRef.repository.name
        };
        const author = {
            username: content.actor.name
        };
        const comment = {
            text: content.comment.text,
            oldText: content.previousComment
        };
        let text = '';
        text += '@' + author.username + ' updated a comment on a pull request:\n';
        text += 'Comment:\n';
        text += '~' + comment.oldText + '~\n';
        text += '_' + comment.text + '_\n';
        const attachment = {
            author_name: content.pullRequest.title,
            author_link: config.bitbucketUrl + '/projects/' + pullRequest.projectKey + '/repos/' + pullRequest.repo + '/pull-requests/' + pullRequest.id + '/overview',
            ts: new Date().toISOString()
        };
        return {
            content: {
                text: text,
                attachments: [attachment],
                parseUrls: false,
                color: ((config.colorDefault !== '') ? '#' + config.colorDefault.replace('#', '') : '#225159')
            }
        };
    }
};

class Script {
    /**
     * @params {object} request
     */
    process_incoming_request({ request }) {

        var result = '';

        if (showNotifications[request.content.eventKey] === true) {
            var func = request.content.eventKey.replace(new RegExp(':', 'g'), '_');
            result = processors[func](request.content);
        }

        return result;
    }
}

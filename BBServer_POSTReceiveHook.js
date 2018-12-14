const config = {
    bitBucketUrl: '',
    color: '#225159',
    update: true
};

const bitBucketUpdate = (request, i) => {
    const text = 'New ' + request.content.refChanges[i].type.toLowerCase() + ' on project ' + request.content.repository.project.name;
    const username = request.content.changesets.values[i].toCommit.author.name;
    const usermail = request.content.changesets.values[i].toCommit.author.emailAddress;
    const attachment = {
        author_name: username + ' (' + usermail + ')',
        title: 'Repository "' + request.content.repository.name + '" in project "' + request.content.repository.project.name + '" updated',
        title_link: config['bitBucketUrl'].replace(/\/$/, '') + '/projects/' + request.content.repository.project.key + '/repos/' + request.content.repository.slug + '/browse/',
        text: username + ' updated ' + request.content.changesets.values[i].changes.size + ((request.content.changesets.values[i].changes.size > 1) ? ' files' : ' file') + ' on branch ' + request.content.refChanges[i].refId + '` with message:\n"' + request.content.changesets.values[i].toCommit.message + '"',
        color: ((config['color'] != '') ? '#' + config['color'].replace('#', '') : '#225159'),
        ts: new Date().toISOString()
    };
    return {
        content: {
            text: text,
            attachments: [attachment]
        }
    };
};

class Script {
    /**
     * @params {object} request
     */
    process_incoming_request({ request }) {
        let result = {};

        request.content.refChanges.forEach(function (change, i) {
            if(config[change.type.toLowerCase()]) {
                switch(change.type) {
                    case 'UPDATE':
                        result = bitBucketUpdate(request, i);
                }
            }
        });

        if(result.content !== undefined) {
            return result;
        }
    }
}
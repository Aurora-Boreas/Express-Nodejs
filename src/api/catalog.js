import request from 'request';
import ProcessorFactory from '../processor/factory';

export default ({config, db}) => function (req, res, body) {

  let indexName = ''
  let entityType = ''

  // pass the request to elasticsearch
  let url = 'http://' + config.elasticsearch.host + ':' + config.elasticsearch.port + req.url;

  request({ // do the elasticsearch request
      uri: url,
      method: req.method,
      body: req.body,
      json: true},
    function (_err, _res, _resBody) {
      if (_resBody && _resBody.hits && _resBody.hits.hits) { // we're signing up all objects returned to the client to be able to validate them when (for example order)

        const factory = new ProcessorFactory(config)
        let resultProcessor = factory.getAdapter(entityType, indexName)

        if (!resultProcessor)
          resultProcessor = factory.getAdapter('default', indexName) // get the default processor

        resultProcessor.process(_resBody.hits.hits).then((result) => {
          _resBody.hits.hits = result
          res.json(_resBody);
        }).catch((err) => {
          console.error(err)
        })
      }

    } else {
    res.json(_resBody);
  }
});
}

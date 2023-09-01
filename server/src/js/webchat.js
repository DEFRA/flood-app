import * as webchat from '@defra/flood-webchat'

const availabilityElement = document.getElementById('wc-availability')

if (availabilityElement) {
  webchat.init(availabilityElement.id, {
    brandId: availabilityElement.dataset.cxoneBrandId,
    channelId: availabilityElement.dataset.cxoneChannelId,
    environmentName: availabilityElement.dataset.cxoneEnvironmentName,
    availabilityEndpoint: '/api/webchat/availability',
    audioUrl: availabilityElement.dataset.audioUrl
  })
}

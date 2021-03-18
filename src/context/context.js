import React, { useState, useEffect } from 'react'
import mockUser from './mockData.js/mockUser'
import mockRepos from './mockData.js/mockRepos'
import mockFollowers from './mockData.js/mockFollowers'
import axios from 'axios'

const rootUrl = 'https://api.github.com'

const GithubContext = React.createContext()

const GithubProvider = ({ children }) => {
  const [githubUser, setGithubUser] = useState(mockUser)
  const [repos, setRepos] = useState(mockRepos)
  const [followers, setFollowers] = useState(mockFollowers)
  //requests and loading
  const [request, setRequest] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState({ show: false, message: '' })

  const searchGithubUser = async user => {
    toggleError()
    setIsLoading(true)

    const response = await axios(`${rootUrl}/users/${user}`).catch(err =>
      console.log(error)
    )

    if (response) {
      setGithubUser(response.data)
      const { login, followers_url } = response.data
      //repos
      axios(`${rootUrl}/users/${login}/repos?per_page=100`).then(response =>
        setRepos(response.data)
      )
      //followers
      axios(`${followers_url}?per_page=100`).then(response =>
        setFollowers(response.data)
      )

      await Promise.allSettled([
        axios(`${rootUrl}/users/${login}/repos?per_page=100`),
        axios(`${followers_url}?per_page=100`),
      ])
        .then(results => {
          const [repos, followers] = results
          const status = 'fulfilled'

          if (repos.status === status) {
            setRepos(repos.value.data)
          }

          if (followers.status === status) {
            setFollowers(followers.value.data)
          }
        })
        .catch(error => console.log(error))
    } else {
      toggleError(true, 'There is no user with matching username')
    }
    setIsLoading(false)
  }

  const toggleError = (show = false, message = '') => {
    setError({ show, message })
  }

  //check rate after every load
  useEffect(() => {
    axios(`${rootUrl}/rate_limit`)
      .then(({ data }) => {
        let {
          rate: { remaining },
        } = data
        setRequest(remaining)

        if (remaining === 0) {
          toggleError(true, 'you have exceeded your hourly rate limit')
        }
      })
      .catch(err => console.log(err))
  }, [isLoading])

  return (
    <GithubContext.Provider
      value={{
        githubUser,
        repos,
        followers,
        request,
        error,
        searchGithubUser,
        isLoading,
      }}
    >
      {children}
    </GithubContext.Provider>
  )
}

export { GithubProvider, GithubContext }

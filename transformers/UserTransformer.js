class UserTransformer {
    static transform(user) {
        return {
            id: user.id,
            name: user.name,
            email: user.email,
            bio: user.bio,
            avatar_url: user.avatar ? `${process.env.BASE_URL}/${user.avatar}` : null,
            status: user.status
        };
    }
}

module.exports = UserTransformer;
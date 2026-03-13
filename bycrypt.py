import bcrypt

password = input("Enter password: ").encode("utf-8")

salt = bcrypt.gensalt()

hashed = bcrypt.hashpw(password, salt)

print("Hashed password:")
print(hashed.decode())